# Windows, the Pokédex device, the title, the map and the rooms

Moved out of CLAUDE.md on 2026-10-14 so every session loads less; the text is unchanged. Dates are when each call was made: where two notes disagree, the later one wins.

- **Dialogs**: native `<dialog>` elements. Most use `openDialog`/`closeDialog`
  in `js/ui.js`, which wrap `.showModal()`/`.close()`. The **shop dialog is
  the exception** — it uses `.show()`/`.close()` directly (non-modal), so it
  floats above whatever screen is showing without blocking or hiding it.
  That's intentional: don't "fix" it back to `showModal()`. The one exception: the Safari's prep window opens it with
  `toggleShop('balls', { modal: true })`, since it must pop up over that modal window (`docs/reference/safari.md`).
  **Every window closes on a tap outside it** (the user's call, 2026-09-27): `js/ui.js` closes any modal dialog when
  a press starts and ends on its backdrop (with the `cancel` sound); the result and yes/no windows click
  their stand-in button instead (`OUTSIDE_TAP`: Main menu, No). The Game Corner, having no backdrop,
  closes on any tap elsewhere and swallows that tap (`initShop()`; the shop button and locked starters still toggle
  it). The Bag, zooms and
  focus layers already did. **The Collection is a device** (2026-10-05, three passes): the
  red handheld grown into `js/device.js` (`#collection-screen`, fixed, full screen on phones with a thin frame, a 500px
  device on the title's sky wider). It comes up closed (its cover shows your partner and badges, an LED blinking for an
  unseen badge; a beat later, or on a tap, it swings open) and the screen boots ("HELLO, NAME!") onto
  the home screen (`js/collection.js`): the owner's ID strip (the Trainer Card; the lid's yellow light blinks for an unseen badge) and a 3x3
  grid of apps, each with its count, "???" + a padlock until unlocked (a tap says how). Its app and dock icons are smooth vector art, `smoothIcon()` in `js/smooth-icons.js` (the user's call, 2026-10-05: no pixels; since 2026-10-06 every emoji inside it too, `SMOOTH_EMOJI` swapped in by `js/icons.js` under `[data-smooth-icons]`, cards excepted; Record Book and Hall of Fame are a book and a crown, no longer the newest winner's sprite). `openApp()` slides an app over the home
  screen: Pokédex (`pokedexApp`: `#dex-list` / `#dex-device` move into the screen, the page drops its lid, and move back
  into `#dex-dialog` when its window opens), Relics and Items (`bagApp()` in `js/bagdex.js`, 2026-10-06: the Pokédex's banners and
  handheld, a banner per group in flat colours, each thing blown up on a screen in its group's colours, sprites trimmed by `thingArt()`), Stats (`statsApp` in `js/statsdex.js`, 2026-10-06: "Trainer Data", five banners onto the handheld, seven-segment digits counting up, an HP-bar win rate, boss badge slots, a PC Box of champions), Achievements (`achievementsApp` in `js/records.js`, 2026-10-06: the same banners and handheld, one goal per screen, a gold UNLOCKED stamp; Relics, Items and it all run on `shelfApp()` in `js/bagdex.js`), Trainer Card (its `open*(into)` draws into
  the screen instead of opening the window), and since pass 2 Moves (`movesApp()` in `js/cardindex.js`, redone 2026-10-06: the Pokédex's green LCD, smooth type keys,
  the Index's All / Attack / Skill / Power filter and Cost / A-Z sort (saved), then the real cards in a
  grid, ??? silhouettes after the known ones, a tap zooms one; the old Index window was retired in D2, 2026-10-07), the Safari
  Pokédex (`safariDexApp`, the Pokédex's banners and handheld on `shelfApp()` since 2026-10-07: a painted banner per area;
  no window of its own, and no longer a banner in the Pokédex app) and the Record Book / Hall
  of Fame (`recordsApp()` in `js/halloffame.js`, Pokédex style on `shelfApp()` since 2026-10-06, the user's picks: the Record
  Book a banner per Trainer Level, the Crystal Depths and Lost runs, one run a screen; the Hall of Fame no banners, one gold
  handheld, each champion on a gold pedestal under a spotlight on a starry screen, A replays its win scene. A tap on the
  screen, A in the Record Book or "Full record" slides the run's full page over it (shelfApp's `sheet`), B closes it; since 2026-10-06 that page is the handheld too,
  `.bdx-sheet` in `css/menus.css`: a red lid, the run's Pokémon on a screen in its type's colours, its numbers, relics,
  items and HP chart on green LCDs, the deck on a dark screen, gold in the Hall of Fame; the loss recap window outside the device is unchanged).
  D-pad left / right steps Moves' and the Safari's tabs. Only the Leaderboard and zoomed cards open over it. The
  hardware: D-pad (the highlight, shown once used: `.keyed`; in an app it steps a Pokédex page or scrolls), A opens, B
  backs out (a Pokédex page to its biomes, an app to home, home shuts the device with the screen collapsing and the cover
  closing). Escape is B; a tap on the sky around it shuts it (pointer events, as iOS Safari sends no `click` for a tap
  on a plain section). Shut, the screen is hidden again so the title's keys aren't taken. Pass 3: the old Poké Ball menu's
  Collection (one button, which replaced its Pokédex / Stats / Achievements) and the Bag's Trainer Card open it straight into an app (`openDeviceApp()`: the run's
  biome page, a Safari run's area) as an overlay over whatever is showing (`.over`, z-index 100, never `showScreen()`, so a
  run underneath is untouched); B out of the Bag's Trainer Card shuts it. **The top bar's Pokédex** (2026-10-05, the
  user's call: `#brand-btn`, an 18x18 pixel handheld, replaced the Poké Ball and its whole drop-down menu) opens the
  device over any screen on its home screen (`openPokedex({ dex, safari })` in `js/collection.js`: its Pokédex / Safari apps
  open on the run's page). Under the app grid a **dock** (`dockRow()`): Settings and Help (Settings borrows
  `#dev-settings` from `#dev-parts` in `index.html` while open; Settings is a games' OPTIONS screen since
  2026-10-06, a card per group (Trainer: the nickname box, `setTrainerName()`; Sound: mute, Music / Effects / Cries bars with LCD numbers; Display: Scenery (Hybrid / Pixel), Device colour (the shell in six colours: `data-shell` on `<html>` swaps the `--shell-*` variables in `css/base.css`, which every red part of the device, Pokédex and full record reads; a new red part there must use them; a shell that would swallow its buttons also swaps `--pad` / `--pad-on` (D-pad) and `--btn-a` (A and round buttons): Black gets a grey D-pad and red A, Blue a pink A), Text speed, Day & night, Flashing & shake (`calmFx()` in `js/prefs.js`, `html.calm-fx`: Reduced, or reduced motion, stops every shake and strobe and softens white-outs to one faint fade; the scene painter's preludes skip their white frames via `whiteOut()`, and the evolution plays its still version; a new flash or shake should check it);
  Battle: speed, animations (`battleFx()` in `js/prefs.js`: off skips move effects and slow intros, like reduced motion; a new battle effect should check it), end-turn warning, Vibration; Save: Sign in, Abandon run only over a run, and Reset save (two asks, `resetAll()`; keeps Settings' choices, `PREF_KEYS` in `js/storage.js`); `js/settings.js`'s `OPTIONS`); Help is How to play, an app on `shelfApp()` since 2026-10-08, `howtoApp` in `js/howto.js`: a banner per topic (Your Run, Battle, Cards, Types, The Map, Money, Going Further), one tip a screen in smooth vector art, About & credits above the banners, each banner's pictures its own (`bannerArt()`: big and huddled, a Pokémon in the middle, Cards the old fanned hand of a Fire, Grass and Water card); the title's ? bubble on the New game sign (`helpRow()` in `js/title.js`) and the first launch open it over the title, `openHowto()` in `js/collection.js`; numbers come from the data, a new mechanic worth explaining is a `tip()` line), the Game Corner, and only over a screen (`deviceOver()`) Main
  menu, which puts the device away at once (`hideDevice()` in `js/device.js`). The Game Corner is an app since 2026-10-07
  (the user's call: it closed the whole device): `cornerApp` in `js/shop.js` moves the cabinet's CRT into the screen, the
  D-pad is the joystick, A or its Buy pill buys (twice), B goes back home; the top bar's and the title's Game Corner
  still open the cabinet. The character select has no top bar (2026-10-07, the user's call): its device reaches the top,
  the coins sit on its LCD (`.sel-coins`), and a locked skin's Game Corner button opens this app on that skin
  (`aimCorner()` + `openDeviceApp('corner', …, refreshSelect)`), B shutting it back to the select. The old menu's
  Index is gone (the Moves, Relics and Items apps are it). Friends (`friendsApp()` in `js/friendsdex.js`, 2026-10-16) sits after Quests: `docs/reference/towns.md`'s Friends app. **The Pokédex** (`#dex-dialog`, `js/pokedex.js`) is full screen with its own ✕, no backdrop: a banner per biome opens a red handheld on that page, and Escape there goes back to the banners (2026-10-05). Pass 2 (same day): each banner and the device's screen show a still of the biome's own scene at the current hour (`sceneShot()` in `js/scene.js` paints one off-screen and puts the live scene back; wilds in the first two places, an Alpha in the third, a boss in its arena, on its battle pad); a banner zooms up into the device, a front cover swings open on its left hinge with the `dex-on` blip, the lights blink and the screen flickers on (`bootDevice()` / `shutDevice()`, reversed going back); entries slide across the screen and their text types itself out (a tap finishes it). Reduced motion skips it all.
- **The title opens on a shut Pokédex** (2026-10-08): the first tap powers it on (logo and hello on its screen), then it
  lifts away onto the menu; a first launch dives into its screen, onto How to play, so the device boots once. Smooth light
  over the title's pixel sky is `js/title-light.js`. Detail in `docs/reference/title-screen.md`. On `secret-base`
  (2026-10-08, the user's calls): `#title-screen` is not `hidden` in the HTML, so the shut Pokédex is the first paint (the
  select's empty device showed while the scripts loaded), and its `hub-mode` class keeps the old pixel sky, signs and
  flyer off from that first frame; `showTitle()` builds the walkable Clearing behind the veil at once (`showHub(…, { hold:
  true })`: no partner, no keys), and after the power-on `enterHub()` walks your partner in from the bottom of the screen
  as the logo comes up. A new player (no `seenHelp`, no nickname; `?onboard` any time) powers it on straight into setup
  (2026-10-11, the user's ask: `onboard()` in `js/title.js`): WHAT'S YOUR NAME? then CHOOSE YOUR BUDDY of the three free
  starters, saved as the nickname and the PC's walking buddy (`refreshBuddy()` in `js/hub-3d.js` swaps it in before it walks
  in); the opened screen shows the walking buddy over the hello in place of the title, hopping with its cry (`showBuddy()`).
  Names are in capitals everywhere (`upper()` in `js/leaderboard.js`, every name box `text-transform: uppercase`). How to play, from the hub's ? or the first launch, grows out of / shrinks back into the bar's
  `?` key beside Home (`openHowto(from, onClose)`, `bootHowto(from)`, `hubDex()`).
- **Every way in boots the device** (2026-10-07, the user's ask): New game (the select, `newGame()` in `js/main.js`),
  Continue (the map, `continueGame()`, not a Sky Pillar climb) and the Safari / Sky Pillar lobbies open under the
  Collection's cover (`coverArt()` from `js/collection.js`), which swings open onto the screen saying "HELLO, NAME!"
  (`bootDevice(host, { below: lid, screen })` in `js/device-boot.js`; a tap on the cover opens it at once). A film over
  the device boots it after it ends (`after`: the film's promise keeps the device hidden till then): Continue waits for a
  place's walk-on (`continueRun()` returns it), a new run's map boots after the first biome's film (`startBiome()`), and after any perk screen in front of the map (Relic Charm, Chansey's Gift, Move Tutor Notes: `bootMap()` in `js/run.js` waits for `showMap()` to reach the map itself). The
  lobbies fade in over the title (`lobbyIn`).
- **The map is a Pokédex** (2026-10-07, the user's call): `#map-screen` (not in a Sky Pillar climb, `.tower`) is the
  device full screen: `.mdex-window` (the run card on the scenery; the shell round it is its own `100vmax` shadow, so every
  later part must be positioned to paint over it), `.mdex-hinge` (lens, lights, the biome / place signs restyled as an LCD; on top since 2026-10-08, above the run card; after the Home key a POKéDEX pill, `#map-dex-btn`, opening the device straight on the run's biome page or Safari area, 2026-10-13, the user's ask; not on a climb),
  `.mdex-glass` (the map scrolls inside it), the top bar's Pokédex shown as a round Home key (`.home-key`) and `.mdex-dock`, the Bag's pockets as a menu bar (it opens the Bag over it, the
  top bar's Bag hidden there). The Bag itself is the device's too (shell, LCD title, pocket buttons, each pocket on a green LCD), and so are the deck and map-peek windows and the run's end windows (result, unlock, yes/no, loss recap) (`.dev-window`), and the deck pickers (Forget a move, PP Up, Day Care: `showChoice()`'s `deck-pick` layout, the deck on a dark screen scrolling in the glass, 2026-10-07; under the text box the yes/no window's two keys, the one-word confirm `#reward-ok` left, gold like the room bar's, greyed until a card is picked, then glowing, and Skip right, the picked card's dim stopping above them, 2026-10-08). Detail
  in `docs/reference/map-screen.md`. **Rooms** (? events, the Center, the Mart, the grotto) and the deck pickers have no
  top bar (2026-10-07): the rooms get `#room-bar` along the bottom, one row: Home (the Pokédex, the map's round `.home-key`), Leave (`#reward-skip` moved in
  by `showChoice()` as `.room-leave`, a round key like Home with a door and an arrow out, `roundKey()` in `js/main.js`), then HP and ₽ on one LCD (no PokéCoins, 2026-10-07); on top
  of it the Pokédex's hinge (`.room-hinge`: lens, lights, the room's title alone on a small LCD sized to it, no biome line (the user's call, 2026-10-07), in place of the title plate).
  The move pick after a fight (`layout: 'learn-room'`, `.learn`; the signature-move picks too) and the found item and relic picks (`item-found`) get the bar and hinge too, keeping their own Reroll (since 2026-10-08, the user's calls: their Skip is a round key by Home like it, a double chevron, `.room-skip`, and every confirm, Take it / Put in Bag / Add to deck / a card's focus confirm over a room, is a glowing gold pill beside the hinge's lights saying one word (Take, Add, Learn, Upgrade...: `ONE_WORD` or the label's first word), `#room-ok`, armed by `roomConfirm()` in `js/rewards.js`, greyed in place until a pick and, once pressed, pushed in and lit until the screen moves on (`pressConfirm()`, never hidden under the finger; the user's call, 2026-10-08); Skip and Leave ask "are you sure?" first (`askFirst()`: Leave only while the room still has a pick, Back never); no pills over the scene; and the text box on every `.in-room` screen is the cream speech window, green kept for the device's readouts);
  Those fight reward steps (`.learn`) and the Mart (the user's ask, 2026-10-14; the other rooms don't) also get a Bag key on the hinge, right of the gold confirm pill (moved there from beside Skip, the user's call, 2026-10-14; `#room-bag`, a round key, `roundKey('bag')`; the user's ask, 2026-10-14): it opens the top bar's `#bag` on Items, the hidden top bar brought back fixed and unseen with only the Bag showing, risen over the room bar (`css/screens.css`).
  `showChoice()` sets `#reward-screen.in-room` for all of them. There is no page footer any more; the disclaimer is in About.
