# The Clearing, Secret Base, Poké Mall and Game Corner

Moved out of CLAUDE.md on 2026-10-14 so every session loads less; the text is unchanged. Dates are when each call was made: where two notes disagree, the later one wins.

The first section began as the note on playtesting the live site and grew into the hub's whole history. The sections after it are newer; the Clearing's layout (the last one) replaces the older positions.

- **PLAYTEST ON THE LIVE SITE** (no session needed): https://patreekare.github.io/pokeDB-3/ on their phone or PC,
  a few minutes after a push. This is the default way to playtest. Adding `?levels` to the URL unlocks every Trainer
  Level for good (`init()` in `js/main.js`), so the user can playtest Level 3/5 without climbing. `?coins=5000` sets the PokéCoins (the same place). **A branch's playtest link** (the user's ask, 2026-10-10: give one every time work sits on a branch): `https://rawcdn.githack.com/patreekaRe/pokeDB-3/<full commit hash>/index.html`, pinned to the pushed commit (2026-10-11: a branch link, `raw.githack.com/.../<branch>/`, served the user an old build from its cache, so they saw none of the new games), its own empty save, so add `?coins=` and what the test needs. `?safari` opens the Safari Zone for good (`save.safariPass`, read by `safariOpen()`), to test it and its leaderboard without finishing the Pokédex. `?mewtwo` unlocks Mewtwo for good the same way, to playtest its run (and the Crystal Depths). `?base` (branch `secret-base` only, until the user says) opens the Secret Base, a 3D room you decorate in place, its first room always a bed, a lamp, a rug under the window and a present of starter furniture to tap open (`FIRST_ROOM` / `STARTER_GIFT` in `js/secret-base.js`), furniture owned by kind (`secretBase.owned[kind]`, every colour of it free: a picked piece's Colour key lists its 20, `recolour()` in `js/base-3d.js`; the user's call, 2026-10-08; and a reskin family, one painter's kinds differing only by the picture on them or the thing on top, is a `set` bought and owned as one by its first kind, `own` / `DESIGNS` / `styles()` in `js/base-furniture.js`, its styles on the Colour key too: 31 sets, 1,096 kinds, 907 designs to buy; a new reskin family needs `set:`) and bought at the Poké Mall's Furniture store, 8 kinds a UTC day for PokéCoins, one of each kind (seat, table, storage, light, plant, rug, wall, and a doll or anything else; `SLOTS` / `KINDS_OF` in `js/secret-base.js`), every piece 50 to 150 (`shopPrice()` in `js/base-furniture.js` puts the authored prices on a log curve, wallpapers and floors too; the user's call, 2026-10-09) (`furnitureStock()`; the sheet's Shop tab was removed 2026-10-09, the user's call, and its Furniture tab got filter chips by kind, `KINDS_OF` / `filters()` in `js/base-3d.js`, and bigger text; since 2026-10-09 (the user's pick) the sheet's tiles are small and nameless, five across, a taken piece's name said for a moment in the hint (`named`), and a grip on its top edge or a tap on the hinge's lens folds it to its hinge (`folded`, `.base3d.folded`), a tab opening it again; wallpapers and floors with a `price` are tried on with a tap and bought with a second in their own tabs, `paperTap()`, saved in `secretBase.papers`), out of a catalogue of 19,602 painted in code, 1,096 kinds x 20 themes, painted smooth since 2026-10-08, clean and detailed like Animal Crossing (the user's call, reversing the same day's pick of detailed pixel art: the kit is `js/base-paint.js`, painters still draw in a tile's 32 units but every brush is anti-aliased, gradients, round padded cushions, true circles, fine wood grain, and `finish()` gives a soft edge and rim light; a piece's picture is `p.art(dir, s)`, `s` canvas pixels a unit: 1 for the carving and the 2D room, `HD` (4) for every texture, the store and tray (2), cached least-recently-used; `tex()` / `trim()` in `js/hd2d.js` read a canvas's `hd`; a piece's picture is `p.art(dir)`; in the 3D room and the Furniture store every piece is a real 3D model (`furnitureModel()` in `js/base-mesh.js`, 2026-10-09, the user's ask: carved pieces looked blocky, some had no side or didn't turn): a kind with a shape in `js/base-shapes.js` (seats, tables, desks, storage, beds, cushions, lamps, plants: ~150 kinds) is built from parts (rounded boxes, superellipsoid cushions, lathed legs and pots, wood grain / cloth weave, its theme's colours; a flat table's or quilt's painting on its top, a desk's or counter's `thing` its painting puffed up); any other piece is turned on a lathe where its rows are one centred run, and the rest is its rounded hull (front ∩ side silhouettes, each slice an ellipse, meshed by surface nets; a piece painted the same all round makes each run a round tube, dolls get a softened back), plants (the Plants shelf and `LEAFY`) are a lathed pot under two crossed cards of the painting, cut out by alpha (`leafyModel()`, 2026-10-09: the hull made their leaves a lumpy blob), and so are ~50 open frames, ladders, stands and spindly pieces in `LEAFY` whose hull lost their holes or tops (arches, Ferris wheel, bunk bed...; a new such kind joins the set); the hull is Taubin-smoothed (`taubin()`), its row steps read as 3D-print layers; the globe and drum kit are modelled (`B.globe`, `B.drumkit`; a part whose material has `userData.pivot` turns about its middle); round things in `ORBS` (item ball, beach ball, planets, crystal ball, globes, pumpkin...) are a true sphere (`ballOf()` finds the ball in the painting, `ballMeshes()`; 2026-10-09, the user's ask: the item ball was lumpy), their stand or stem made as before, Poké Balls (`POKEBALLS`) drawn with one button facing front, the rest wearing front and back paintings, the planets a modelled meridian and pin (`MERIDIAN`). **Furniture does things** (2026-10-09, the user's ask): `js/base-play.js`, one `PLAY` line a kind (`does`: screen, light, fire, door, note, beat, player, heal, give, steam, water, bubbles, fish, zap, spin, rock, boing...), `dressPlay()` fitting a model in `makePiece()` (a live canvas screen over its glow colour, a door cut from its painting with an inside picture, the Healing machine's six Poké Balls), `tapPlay()` from a walk-mode tap (before sitting), `tickPlay()` each frame; TV channels and arcade attract modes are `SHOWS` painters (a set with several flips to the next by itself every 12 s, `CHANNEL_MS`, a tap at once), notes and knocks are synths in `js/audio.js` (`<voice>-<n>`, `fx-*`, `FURNITURE_NOTES`); anything without a line wiggles; a lamp switched off keeps `userData.off` through `setTime()`; `tools/play.html` shows them, tap to try. Bigger rugs (2026-10-09, the user's ask): every pattern also comes as a Large rug (4x3, fringed), a Grand rug (6x4 oval) and, for the runner patterns, a Long runner (5x1): sets `bigrug`, `grandrug`, `longrunner` in `js/base-furniture-kinds.js`, 20 more kinds; so a new kind needs no model, only paintings (`p.art(dir, 1, true)` is the shadow-free one read for shapes); `js/base-model.js`'s carving is only the fallback; `tools/models.html` shows every model (`?ids=sofa,bed` four sides); a shape's `seat` is where a Pokémon sits (guests pick any seat; a tap on one walks your partner there, a floor tap gets it down: `sitPartner()` / `getUp()`), its `top` a table top small pieces stand on (`small()`, ≤ 2 tiles painted, one a tile, saved `up: 1`, at 0.72 size; moving, turning or storing the table takes them along: `ridersOf()` / `standing()` in `js/secret-base.js`, `pickUp()` / `turnRiders()` in `js/base-3d.js`); the room renders sharper and smooth (`createPost(renderer, { short: 820, crisp: false })`, 4x MSAA; its canvas drawn at the scene's own size, never 2x, and a device under ~40 fps steps down, shadows then resolution, remembered in `pokedb.base3d.low`: `keepUp()` / `stepDown()`, 2026-10-09, the user found it laggy); the first 25 kinds in `js/base-furniture.js`, the rest in `js/base-furniture-kinds.js` and the themed shelves in `js/base-furniture-rooms.js` (batch 1 of the road to 1,000: Kitchen, Garden, Pokémon Center, Gym, Beach, Spooky) and `js/base-furniture-rooms2.js` (batch 2: Bathroom, Bedroom, Office, Café, School, Winter) and `js/base-furniture-rooms3.js` (batch 3: Festival, Lab, Castle, Japanese, Toys, Types) and `js/base-furniture-rooms4.js` (batch 4: Music, Library, Pirate, Space, Farm, Underwater) and `js/base-furniture-rooms5.js` (batch 5, the last: Desert, Hot Spring, Arcade, Greenhouse, Station, Sky Palace), built from shared painters: chairs by back, rugs / mats / posters / banners / cushions by pattern or a 9x9 `MOTIFS` stamp, plants and Berry bushes, ~50 things, and 120 Pokémon dolls (60 Pokémon, small and big) sewn as real plushies (`PLUSH` in `js/base-dolls.js`, 2026-10-08, the user's ask: a build, biped / quad / ball / blob / fish, its fabrics, ears, tail and `EXTRAS` each; big head, stubby limbs, button eyes, a stitched mouth; the old `DOLLS` bitmap is only the fallback, `plush()` in the kit; in 3D since 2026-10-09 each is sewn from the same pattern, `sewPlush()` in `js/base-plush3d.js` lending `js/base-dolls.js` a 3D pen (`sewWith()`): stuffed ellipsoids, soft extruded patches hugging what is under them, bead eyes, the tail swung behind; the puffed-up dolls looked like melted candles, the user's call; a piece's `doll` is [pattern, height]), `solo`: one look, never themed; a family's `group` is its shelf, `seat` makes a Pokémon rest on it, `sky` makes a window; `tools/furniture.html` shows them all by group; a new kind is a family entry, a new theme a `THEMES` palette; `&basefresh` the first room again, `&allfurniture` every piece to hand), up to 6 Safari catches living in it (`js/base-3d.js`; it opens on Walk: just the room and a round Decorate key, and a red doormat (the only way out since 2026-10-09, the user's call: no ✕ in the base or the mall; `doormat()` in `js/hd2d.js`, shared with every place of the Poké Mall, `addDoor()` / `headOut()` in `js/mall-3d.js`, a shop's mat back to its doorstep in the hall, the hall's out to the Clearing) on a doorstep outside the front edge (no tile taken) whose tap walks your partner out over it like a Pokémon house (`makeExitMat()` / `headOut()`, 2026-10-09, the user's ask), the camera low and close on your partner; Decorate blends to a higher shot of the whole room over a sheet in the Pokédex's shell since 2026-10-09 (the user's pick: the hinge one line since 2026-10-08, no LCDs (the user's call): lens, lights, the tabs as round keys and Done as the gold pill, then the filter chips, the tiles on a pale screen; `.b3-sheet` in `css/secret-base.css`), a piece in hand or picked tucking the sheet down to its hinge, the tabs swapped for round keys Turn / Colour / Store / Cancel and the gold pill Place or Done, no hint box over the room (`.tucked`, 2026-10-08, the user's ask: the sheet, hint and key strip covered the room), the camera gliding to the new fit (`easeShots()`), Done back to Walk, `setMode()` / `SHOT`; Walk uses the Clearing's tilt and framing, Pokémon leaning back like outside (the tall walls and wooden base, `dressRoom()`, were taken out again 2026-10-09, the user's call: they liked the open diorama of the start); Decorate zooms in with a pinch or the wheel (up to `ZOOM_MAX`) and a drag on the floor pans it, the tilt-shift's focus following the view (`setZoom()` / `panBy()`, 2026-10-09, the user's ask); `&flat` the 2D fallback, `js/secret-base.js`; `&time=night`, `&fps`; `&guests` lends every Safari Pokémon as caught). On the same branch the title is a walkable 3D Clearing after PRESS START (`js/hub-3d.js`, tap to walk, or hold and drag and your partner follows the finger (`onDown()` / `onDrag()` / `walkTo()`, 2026-10-11, the user's ask), places open what the signs do, the Pokédex the round Home key on its bottom bar, the device growing out of it (`from` in `openDevice()`), the Safari gate at the back-left road's end, set back behind the Ancient Tree since 2026-10-09 (the user's ask: the Safari lobby's own gate, `safariArt()`, log posts, a thatched roof and the green board, a fence either side, `safariFence()`; the trees in that corner cleared and the road running on through the gate into a painted view of meadow, trail and snowy mountains square to the camera, `js/hub-vista.js`, lit by the hour; the camera looks on ahead up that road, `ahead` in `placeCamera()`; you walk right up to it over the cleared meadow, `MEADOW` tiles outside the grid, where a small Pokéstop of its own, `pokestop()`, starts or continues the Safari run (only the Pokéstops do, here and at the Sky Pillar: the gate and the Pillar are their own places with no buttons, a tap just says what they are; 2026-10-09, the user's call) and its leaderboard kiosk stands along the fence to the left, 2026-10-09, the user's ask); the Sky Pillar likewise back in the right corner (`PILLAR_AT`, its own meadow tiles, the trees in its corner cleared but those behind it kept), a small Pokéstop left of its door and its board the Safari kiosk in sky blues (`kioskArt(SKY_KIT)`) to the right, 2026-10-09, the user's ask, the Poké Mall out on the left, lined up under the Safari gate a step left of its road and far enough forward that its roof never hides it, facing the camera, a road from the plaza up into the middle of its doors (the plaza, `START`, and the mall moved two rows forward, level with each other, 2026-10-09, the user's ask); the left side forest is gone, open meadow (`MALL_AT`, 2026-10-09, the user's ask: in the grid it stood too near the middle; the title's fade in is off in hub mode, it showed the character select through the Clearing, and the logo greets once, `hub-greeted`; `mallBuilding()`, 2026-10-08, the user's ask: a cream two-storey shopping centre facing you, POKé MALL under a red cornice, shop-lit glass, a glass pyramid; its doors walk into `js/mall-3d.js`, a 3D hall with the Base's look and the Clearing's Pokédex bar along the bottom (`.mall-bar`: Home, How to play, the PokéCoins, the place's name; 2026-10-13, the user's ask): shop fronts on the back wall (`FRONTS`), the hall 21 x 10 since 2026-10-12 (`HC` / `HR`; the shops' floors keep `COLS` / `ROWS`) and dressed in real 3D by `js/mall-hall.js` (the user's ask: bland, small, flat plants and benches): a Poké Ball fountain in a gold-ringed plaza, palms, topiary, benches, lamps, escalators, columns, vending machines, a mall guide, and each shop's entrance built out from the wall (`dressFronts()`: sign boxes, the Furniture store's awning, the Game Corner's marquee of chasing bulbs and velvet ropes, the empty shop's barrier); the mall renders smooth (`createPost(..., { crisp: false })`) and the hall alone has reflections (`hallEnv()`); a tall phone sees more of its depth (`win` in `fitShot()`), the Game Corner the middle one, a flat violet front on the wall since 2026-10-09 (`cornerFront()`; the 3D booth stuck out into the hall), walked into since 2026-10-09; **the Game Corner's revamp** (branch `game-corner-revamp`, 2026-10-10, the user's picks: no betting coins, no prize tickets; rebuilt huge the same day, the user's ask: the shiny case was too small) opens once Meowth is met at a crossroads (`js/meowth.js`; `syncShop()` takes the tape off, Meowth's ribbon to cut; without that, caution tape, `tapeOver()`): its own 21 x 13 floor (`COLS` / `ROWS` / `DOOR` in `js/mall-corner.js`; a place may carry `cols` / `rows` / `door`, `PC` / `PR` in `js/mall-3d.js`, and a deeper one slides a hall-deep camera window with your partner, `camZ`; a place's `tick()` runs each frame), three equal screens mounted on the back wall's right half (`SHOWS`: Pokémon, shinies, perks; Poké Balls dropped 2026-10-12, the user's call) cycling through what they sell on a live canvas (`paintScreen()`), two Plinko boards left of the counter the same size as the screens and raised like them (`PLINKOS`, a live board of balls dropping on its own, `plinkoWall()`; a tap opens the game; 2026-10-12, the user's ask), the home arcade's machines along the back wall, eight each side of the counter, under the screens and the Plinko boards, Whac-a-Diglett on the left wall and the pinball table on the right (`ARCADE`, [kind, x, y, face] each, the user's layout 2026-10-12, their Secret Base 3D models, a tap and a second playing one free, the prize to take home at the counter; 2026-10-12, the user's ask), a tap and a second opening `js/showcase.js` (one thing on a Pokédex screen, ◀ / ▶, arrow keys or a swipe, Buy twice), Meowth's counter between them (a front and two sides back to the wall, Meowth inside close to the front, `COUNTER` / `DESK_W`; 2026-10-12, the user's ask: the stamp sign hid it); down the floor two free games, Voltorb Flip (`js/voltorb.js`) and Who's That Pokémon? (`js/quiz.js`, one 7-question round a UTC day), each round seeded by day and round and saved (`save.corner.voltorb` / `quiz`); the table games (`CASINO` in `js/mall-corner.js`; the lineup the user picked 2026-10-11, Roulette, Memory Match and the Gachapon cut, and Team Rocket Blast-Off on 2026-10-12): ten tap-to-stop slot machines, five down each side wall (both walls' top four taken out 2026-10-12, the user's asks; each the Secret Base's 3D slot machine since then, `machine()` in `js/mall-corner.js`, `js/slots.js`: each reel's STOP lands within `SLIP` of the symbol under the line, three 7s win `JACKPOT` 150, three Pikachu `BONUS_SPINS` free spins paying double), Poké Ball Plinko (`js/plinko.js`, `PLINKO_PAYS`, Drop them all), a Blackjack table with Meowth dealing (`js/blackjack.js`) and High-Low (`js/highlow.js`), **no betting since 2026-10-12** (the user's call: earn, never spend): every game is free, a play staking `STAKE` 10 of Meowth's house chips, and the day's first `PLAYS` of each pay what they win (slots 10, Plinko 10, Blackjack 5, High-Low 5, Voltorb Flip 5 rounds, raised 2026-10-12, the user's pick; the quiz's one round and the scratch card too), up to `DAILY_CAP` 500 a UTC day all told and `GAME_CAP` 150 from one game (`js/data/corner.js`, `capPay()`; `payGame(coins, game)` in `js/corner-pot.js`, `save.corner.pot` `{ day, won, games }`), past them played for fun (`funLine()` / `sayLine()` / `playLabel()` in `js/casino-pot.js`); an average day ~380 since the raise (~250 before) (`averageDay()` in `tests/corner.test.mjs` works it out, under a winning run); the odds about 95% back (`js/data/casino.js`, `tests/casino.test.mjs`), every roll from the day and the play's number (`playRand()`), paid the moment it's rolled, a hand in progress saved (`slHand` / `bjHand` / `hlHand`); plays counted in `save.corner.bets.plays`, a bonus spin its own seed (`freePlay()`), winnings counted in `coinsEarned`; past the paying plays a game is played for fun, earning nothing (prize tickets for them were tried and taken out the same day, 2026-10-12, the user's call: Plinko could be spammed for them; an old save's tickets are cashed in at `TICKET_COINS` 3 each when the counter opens, `cashTickets()`), and **Meowth's prize counter** sells for PokéCoins (`buyPrize()` in `js/corner-pot.js`; a showcase row since 2026-10-12, the user's ask: `showcaseSource()` in `js/showcase.js` lends it a row with painted `art`, games first). **The game prizes are playable at home** (2026-10-12, the user's ask): a walk-mode tap on one in the Secret Base opens its game as free play (`js/home-arcade.js`, `GAMES`, a new playable prize a line there; `setHome()` / `atHome()` in `js/corner-pot.js`: no paying plays, stamps, saved hands or Voltorb boards, records still kept), Who's That Pokémon? endless with a streak (`openEndless()` in `js/quiz.js`, record `quizStreak`). **The home arcade** (patch 1.7, 2026-10-12, the user's ask: "a lot of arcade games to place in their home", all ten offered): twelve more prize machines, 450 each, played at home (and ten of them free in the Game Corner since 2026-10-12, `ARCADE` in `js/mall-corner.js`), each a file on `runArcade()` in `js/arcade-kit.js` (the cabinet window, loop, input in canvas units, Score / Best kept as record `arc-<id>`): Whac-a-Diglett `js/arcade-whack.js`, Pidgey Flap `arcade-flap.js` (`flapcabinet`, in place of Magikarp Fishing, 2026-10-12, the user's call; `RENAMED_FURNITURE` in `js/storage.js` carries an old save's `fishingcabinet` over), Psyduck Pong `arcade-pong.js` (`pongcabinet`), Gastly Maze `arcade-maze.js` (`gastlymaze`; the store's own `mazecabinet` is decoration), Snorlax Stacker `arcade-stacker.js`, Ponyta Dash `arcade-runner.js`, Voltorb Memory `arcade-memory.js`, Slowpoke's Claw Machine `arcade-claw.js`, Poké Ball Skee-Ball `arcade-skeeball.js`, Pokémon Pinball `arcade-pinball.js`, Pikachu Volleyball `arcade-volley.js`, Unown Word Search `arcade-wordsearch.js`, and since patch 1.8 (2026-10-12, the user's yes to eight ideas) Poliwag Crossing `arcade-crossing.js`, Ekans Trail `arcade-snake.js`, Beedrill Invaders `arcade-invaders.js` (a FIRE key under the ground since 2026-10-12, no auto-fire: the user found it annoying), Electrode Breakout `arcade-breakout.js`, Jigglypuff's Sing-Along `arcade-rhythm.js`, Where's Ditto? `arcade-ditto.js`, Geodude Bowling `arcade-bowling.js` and Poké Puzzle `arcade-puzzle.js`, and since patch 1.9 (2026-10-12, the user's pick) Pachirisu Berry Catch `arcade-berry.js` (`berrycabinet`: catch falling Berries, combos up to x5, Pinecos and dropped Berries cost one of 3 hearts), which took Jigglypuff's Sing-Along's place on the counter and the Game Corner floor, and Squirtle Bubble Shooter `arcade-bubble.js` (`bubblecabinet`, after Puzzle Bobble: fire bubbles, three of a colour pop, the ones left hanging drop, the ceiling a row lower every few shots, Puzzle Bobble's levels since 2026-10-13, the user's pick: 20 boards laid out by hand, `BOARDS` in `js/data/bubble-boards.js`, never added to, the ceiling itself lowering them a row every `push` shots (`drop`), coming round recoloured and a shot quicker each lap, `boardCells()`, `tests/bubble.test.mjs`), which took Unown Word Search's (their cabinets `B.arcade`, a `SCREENS` picture each in `js/arcade-art.js`); seven have weekly leaderboards (2026-10-12, the user's pick: Ponyta Dash, Pidgey Flap, Snorlax Stacker, Poké Puzzle, Beedrill Invaders, Ekans Trail, and Squirtle Bubble Shooter the same day; `ARCADE_GAMES` in `js/data/leaderboard.js`, whose ids `firestore.rules` lists too: `arcadeBoard/<week>_<game>_<uid>`, a player's best of the week, raised by a higher score; posted from the kit's game over by `postArcadeScore()`, a 🏆 key on those cabinets opens `openLeaderboard(0, 'arcade')`); every cabinet is full screen and a game's own big keys sit under its screen (`pad`, e.g. Bubble Shooter's SHOOT; 2026-10-12, the user's ask), no Game Corner game closing on a tap outside it (`openPanel()`'s `outside`, the showcase and guide only); every cabinet's How to play is an attract screen with the game's own preview running (`helpScreen()` in `js/arcade-kit.js`); every cabinet wears a lit marquee, the game's Pokémon on a sunburst and its name in a gold logo (`MARQUEE` in `js/arcade-kit.js`, a new game a line there); a game's still parts are painted once and stamped (`stamp()` in the kit: no gradients or hundreds of paths a frame); their machines are painted after the Arcade shelf's `cabinet()` in `js/base-furniture-rooms5.js` (the store's own Pinball, Claw machine and Skee-ball stay decoration) (`js/prizes.js`, a tap on Meowth when no scratch card waits; `PRIZES` in `js/data/corner.js`: only the games since 2026-10-12 (the user's call): the slot machine, Voltorb Flip machine, Plinko board, Blackjack table, High-Low table and Who's That Pokémon? machine and the arcade machines but the claw and skee-ball (retired the same day, the user's call) and Jigglypuff's Sing-Along and Unown Word Search (retired the same day too, the user's call), 450 each, every one shown on the screen as its 3D model turning (`turntable()`, one small renderer); the jackpot sign, Lucky 7 block, casino carpet and Gen 1's prize dolls it sold before are `RETIRED_PRIZES`, kept by whoever bought them, never offered again (`retired` in `js/data/furniture.js`, skipped by `lockedEarned()`); never sold in the store, earned through `js/data/furniture.js`'s `prize` source, `save.corner.prizes`; the six casino games are modelled in 3D since 2026-10-12 (`B.slot`, `B.cardtable`, `B.plinko` in `js/base-mesh.js`, Voltorb Flip and the quiz on `B.arcade`, their pictures in `js/arcade-art.js`), the Plinko board the first wall piece with a model (`makePiece()` in `js/base-3d.js` hangs it, its back to the wall)); every game keeps records (`record()` / `better()`, `save.corner.best`, `RECORDS`, a 🏆 line under each game, `bestLine()`), read by 8 Game Corner badges (`group: 'corner'`, popped up by `badgeNews()`); no leaderboards in the Game Corner (a daily High-Low one was taken out the same day, the user's call); **its regulars** (2026-10-12, the user's ask: alive, never crowded or chatty): `js/corner-crowd.js` (made by `goPlace('gc')` in `js/mall-3d.js`, `crowd.enter()` / `tick()` / `tap()`) keeps `CROWD` 5 of the day's 12 (dealt from `PATRONS` by the UTC date, the five by the hour) at the games, wandering, at Meowth's counter (it answers, `MEOWTH_REPLIES` / `MEOWTH_FOR`), one leaving and another walking in every 45-90 s, only one walking at a time and none stopping by the doormat (`oneWalker`, 2026-10-13, the user's ask); one bubble at a time (`.crowd-bubble`, the ghosts' `.spook-bubble`), 9-17 s apart, now and then a two-Pokémon `CHATS` talk, a word to you nearby, once a visit one walks over to say hi; a tap talks in the speech window; walking up to its game makes it step aside; ~730 lines in `js/data/corner-crowd.js`, a new regular a `PATRONS` entry; Meowth's daily stamp card (a stamp for each different game played that UTC day, `stamp()` / `STAMPS` 5 in `js/corner-pot.js`, `save.corner.stamps`; table games stamp in `stake()`), shown on a sign on the wall just over Meowth's head (`stampSign()`; over it since 2026-10-12, the user's layout, the arcade leaderboard screen, `boardScreen()` cycling `ARCADE_GAMES`' top three from `arcadeTop()` in `js/leaderboard.js`, a tap opening the board, and the GAME CORNER sign moved up over the pink tube), which a full card turns into a scratch card handed over by a tap on Meowth (`KEEPER.special`, `stampState()` in `js/scratch.js`, `scratchCard()`, always a win, `save.corner.scratch`); every game has a How to play card behind a "?" in its head, opened by itself the first time per device (`firstLook()` / `helpKey()` / `helpCard()` in `js/corner-panel.js`); Plinko is 12 rows on a canvas, its bin dealt from `PLINKO_ODDS` (flatter than a coin flip a peg) and its bounces shuffled to land there (`plinkoDrop()`), the ball falling under gravity between strikes; the slot cabinets are `cab()` in `js/mall-corner.js`; no tilt-shift blur (`setPlace()` in `js/mall-3d.js`, 2026-10-12, the user's call); a Pokémon casino carpet (crimson and gold, Poké Balls and card suits, a royal blue runner; `floorArt()`), the side cabinets and neon pillars gone (2026-10-12, the user's call); the floor four tables, two a side of the runner (the user's ask, 2026-10-12): Voltorb Flip and Who's That Pokémon? touchscreen tables behind (`tableScreen()`), Blackjack and High-Low card tables in front, each its name on its front panel (`tableFront()`), 1.5 tiles deep (`TABLE_D`); the slot machines down the side walls facing in (a slot's `face`, `cab(..., turn)`; a spot's `frame.ry` turns the gold frame with it, `pick()` in `js/mall-3d.js`); no Deal of the Day (taken out 2026-10-12, the user's call; an old save's `corner.deal` is ignored); rules in `js/data/corner.js`, `tests/corner.test.mjs`; game panels share `js/corner-panel.js`; a Game Corner spot of `kind: 'game'` opens its `game`; **the Furniture store opens after Smeargle's housewarming** (2026-10-09, the user's ask, Animal Crossing's way): the first time in the Secret Base Smeargle is at an easel painting, says in a cream speech window (`.b3-talk`, a tap a line) that it is opening a shop, then walks out over the doormat (`startVisit()` / `sayNext()` in `js/base-3d.js`); the store opens the next UTC day (`secretBase.shopOpens`, `meetSmeargle()` / `shopOpen()` in `js/secret-base.js`; `syncShop()` in `js/mall-3d.js` takes the tape off and repaints the plaque; till then its door has a note from Smeargle and a countdown), on its first open day a red ribbon crosses its front, Smeargle beside it asking you to cut it, a second tap snips it with confetti and leads you in (`buildRibbon()` / `ribbonTap()`, saved `ribbonCut`; `?ribbon` puts it up for a page load; 2026-10-09, the user's ask), and Smeargle greets the first visit (`shopGreeted`); `?shopopen` opens it for the page load, `&basefresh` brings Smeargle again, `?mall=furniture` still goes in (`js/mall-corner.js`: a neon arcade, confetti carpet, the cabinet's very items and prices (`cornerEntries()` / `buyCorner()` in `js/shop.js`) bought in person with a tap and a second: skins and Poké Balls in a lit PRIZES case, every shiny in a SHINY case (silhouettes till owned), a perk machine each, one dark machine waiting for the prize games, and Meowth (`KEEPER`) behind the prize counter saying every line; a gold frame marks the pick; `?mall=corner` opens it straight away; the cabinet app in the Pokédex stays), the west front the Furniture store since 2026-10-09 (`js/mall-furniture.js`: walked into, laid out like Animal Crossing's Nook's Cranny since 2026-10-09 (the user's pick): restyled after New Horizons' Nook's Cranny on 2026-10-09 (the user's ask): cream plaster between timber posts over light wood wainscoting, a plank floor, leaf-green trim (rose on 2F), a green leaf sign and counter, few things on the walls; the day's stock near life size on 2 x 2 wooden platforms with a sage mat, four along the back and four in front, the tallest at the back, each with a big price card on an easel (`BAYS`, `daisTop()`, `tagArt()`), a counter with a shopkeeper Pokémon behind it saying every line in a cream speech window with its name tag (`KEEPERS`: Smeargle, Minccino upstairs; `talk()` in `js/mall-3d.js`), `?mall=furniture` / `?mall=2f` opens it straight away (`&stock=id,id...` stocks it with those pieces, 8 a floor, for the page load); one of each piece a player (2026-10-12, the user's call: once `owned[p.own]` it poofs off its platform for a SOLD OUT board, `poof()` in `js/mall-3d.js`, `spot.sold` in `buildFloor()`; more copies are the PC's Duplicate; and never dealt again: `dealDay()` leaves owned designs out, so each player's stock is their own, dealt once a UTC day and kept in the save's `furnitureDay`, so a buy stays sold out till the next restock); a tap
  says the price and a second asks in a buy window with its picture, Buy / No (`ask()`, 2026-10-09, the user's ask; the shops' tilt-shift blur is gentler than the hall's, no click sound on walking, the shopkeeper's and Smeargle's speech text big, the second floor has no doormat, its way out the lift); a lift at the back right, its shaft running up to the top of the walls (`liftShaftArt()`; a booth looked odd, the user's call) (`LIFT` in `js/mall-furniture.js`, since 2026-10-09: the stair it replaced sank your partner into its treads, the user's call; its doors slide open with a ding, your partner steps in, they shut, the dial swings and it steps out on the other floor, `liftTap()` / `rideOn()` in `js/mall-3d.js`) roped off till `secretBase.upstairs` is bought for 1,000 rides to a second
  floor of 8 more, `furnitureStock(day, 2)`; one place is shown at a time, `goPlace()`, and rays only test it), the east
  one the Safari Outfitter since 2026-10-15 (see its section below; a new shop is a `FRONTS` line and its painting in `wallArt()`), a mezzanine with the upper floor's lit shops; tap to walk, a tap on a front goes in (no bottom pill since 2026-10-09), the doormat back out to its doorstep, `leftPlace()`), New game a Pokémon Go Pokéstop (`stopDiscArt()`, 70% size: a blue holo disc over a post, bobbing; a tap spins it three turns, a violet flash, then your partner walks out under the Whispering Clearing's gate and New game (or Continue) opens, `spinStop()` / `walkOut()`; back from the select it walks in again, `walkBackIn()`), the Whispering Clearing's gate across the front since 2026-10-09 (the user's ask: `GATE_AT`, `clearingGateArt()`, a torii-like log arch with a hanging WHISPERING CLEARING board and wind chimes lit at dusk, a fence and hedge either side closing the hub off; since 2026-10-09 the gate is scenery you walk under (`buildGateway()`, no place), New game's Pokéstop stands outside it right of the trail (`STOP_AT`) and a Scarlet / Violet-style route sign left (`SIGN_AT`, `routeSignArt()`), the user's ask; the ground runs four rows further down to it, walkable through `MEADOW`, and the camera stops the ground's front edge at the bar's top, not under it, `fitCamera()`), the side forests set back a tile, the Sealed Gate once broken right, no name tags since 2026-10-08: the bottom bar is the rooms' Pokédex bar (`placeBar()`, `.hub-bar`, the room bar's classes): the hinge's LCD names the place your partner walks near (`SEEN`; no gold pill since 2026-10-08, the user's call: a tap on the place does it), on the same line (2026-10-09, the user's layout) small Home and How to play keys that never change into anything else (Home wearing the yellow `.dex-news` "!"; `roundKey()` in `js/smooth-icons.js`), the PokéCoins alone on a mini LCD, the place's LCD on the right; under it a saved run's LCD (its Pokémon, `place` (biome or mode) and floor over a full-width HP bar, the Escape Rope, `smoothIcon('run')`, on the right) that folds down into the bar while there is no run, like an auto-hiding taskbar (`.hub-bar.no-run`, `.hbar-fold`); a saved run is continued where it was started (2026-10-08, the user's call: a Safari run at the Safari gate, a climb at the Sky Pillar, any other at the Pokéstop; `runAt()` in `makePlaces()`, `asks()`), and a tap on that place shows just Continue (the rooms' glowing gold pill, `.room-ok`) and New game on a small red Pokédex shell, no words (`.hub-card.ask`, `showCard()`); the card above it only says what a place is, notice boards by the Safari gate (a white roadside kiosk, `kioskArt()`) and the Sky Pillar (a red pin marker, `pinArt()`; both drawn smooth, not pixel, on `fine()` canvases, and since 2026-10-08 so are the Safari gate, the Sky Pillar and the Ancient Tree, each lit part painted on its own `shine()` map) opening their leaderboards, its light, fireflies and sounds by the hour, a legendary flying over now and then; the Ancient Tree's door walks into the base and its ✕ back out, your partner stepping out of the open door onto its doorstep (`liveLeaving()`, 2026-10-09) (bought once for 1500 PokéCoins, the save's `baseOwned`, `buyBase()`: till then the door is boarded up and a tap asks to buy; over the door a broken "Home" sign hangs off one nail by a frayed rope, swinging left and right, and buying swings it up level and mends it, `homeSignArt(fixed)` / `liveSign()`; 2026-10-08, the user's ask; `?base` still opens it straight away); shared HD-2D parts in `js/hd2d.js`); `?signs` shows the signs for that page load, Settings' Title screen (`titleHub`) for good, `?walk` turns it back on. `?lockdepths` hides the Depths' Pokédex tab again (forgets its Pokémon and `deepestBiome` 4), for a save an old playtest revealed it on. `?smooth` paints the Clearing in the pilot smooth style on that device for good (`js/smooth-clearing.js`, the Sky Pillar lobby's look: full resolution, gradients, glows; it draws in the pixel scene's own units over scene.js's layout and `life`, so sprites, pads and landmarks stay put; events in the Clearing and the Pokédex stills stay pixel); the hybrid (the default since 2026-10-08: Settings' Display has Scenery, Hybrid / Pixel, the save's `scenery`, `hybridScenery()` in `js/prefs.js`; `?hybrid` / `?pixel` set it too, and the title's light follows it) keeps every biome's pixels (the Clearing, Shrine, Wastes, Depths, Ruins, Thornwood, Savanna, the Safari's areas; not events' rooms) and lays smooth light over them instead (HD-2D, `js/hybrid-light.js` on `#scene-light`, a canvas screened over `#scene-bg`: sun / moon bloom, glowing fireflies and pollen, haze on the far hills, a dawn / dusk tint (half strength outside the Clearing, less under a roof), and a bloom read from the frame itself on every pixel in one of the look's `GLOWS` colours: lava, lanterns, crystals, runes, preludes included, so a new biome needs no light code; the Clearing's Deep Woods beams and prelude are `js/hybrid-clearing.js`), saved the same way; the two replace each other, and `?pixel` turns both off. `?time=dawn`, `day`, `dusk` or
  `night` pins the day/night cycle for that page load (`js/daytime.js`); `?season=halloween` / `winter` / `none` pins the Clearing's seasonal dress (`season()` in `js/season.js`, October and December by the date; its look in `js/hub-season.js`; Halloween's yard since 2026-10-10, the user's ask: giant jack-o'-lanterns, a pumpkin patch and scarecrow, a candlelit graveyard, a cauldron (a real 3D model since 2026-10-10, the user's ask: `makeCauldron()` in `js/hub-cauldron.js`, its brew swirling and bubbling, a ladle stirring itself, its fire and brew lamps; a tap plays the next of `TRICKS` in order, cycling (the user's call, 2026-10-10): bubbles, a new brew colour, sparks, boiling over, a ghost rising out, smoke rings), hay, lanterns, a dead tree, glowing caps, each on its own blocked tile (`yardTiles` in `dressSeason()`), grouped since 2026-10-11 into a few spots, mirrored pairs framing the trail and the open ground left clear (the user's call: scattered everywhere it read as clutter), and `js/hub-spooky.js`: Gengar, Litwick, Duskull and Sableye standing about, one strolling at a time in turn, never stopping on or beside a doorstep (`byDoor`, 2026-10-13, the user's ask), a short line now and then in a little cream speech window over the speaker's head (`.spook-bubble`, placed each frame by `place()`; its pop-in class is `spook-in`, never `pop`: screens.css's global `.pop` is battle's damage number at opacity 0, which hid every bubble), a line or a story when tapped in the Furniture store's speech window (`.mall-line`, `.spook-foot` over the bar), and the first time the Clearing shows on a page load the next of the four in turn (`pokedb.spookGreeter`, per device; it was always Sableye, the nearest) walks up to your partner and greets you by nickname (`{name}` in a line is `trainerName()`, mixed through their lines too), their ~400 lines in `js/data/spooky-lines.js`, bats round the Ancient Tree). `?event=move-tutor` (any event id) walks a throwaway, never-saved run straight into that ? room, fights included (`peekEvent()` in `js/run.js`). `?bossfight=wetland` (any Safari area, `&starter=id`) walks one straight into that area's boss fight, prelude and arena included (`peekSafariBoss()`); `?bossfight=depths` (`&hp=0.1`) does it for Eternatus, the final boss, with Mewtwo. `?tower=25` starts a throwaway Sky Pillar climb at that floor (`&hp=0.1` shrinks every foe's HP; `&aug=echo,nova` hands it those augments; `peekTower()`). `?climb` plays the climb's opening film (Climb's, `js/climb-intro.js`) after PRESS START, then that throwaway climb from floor 1. `?biome=ruins` (any biome, `&starter=id`, `&level=0-5`, `&slot=1` / `2` for a pool biome at that fork) starts a throwaway run in that biome (`peekBiome()`). `?descent=mewtwo` plays Mewtwo's fall into the Crystal Depths (after its Biome 3 boss), then the Depths' film and map (`peekDescent()`). `?travel=shrine` (the biome walked to: `?travel=ruins`, or `?travel=wastes&from=ruins` for the Ruins' road; `&starter=id`, `&stage=`) plays that journey film after PRESS START with its first-time lines, never saved; `&at=0.5` holds it at that point of the trip (`peekTravel()` in `js/main.js`). `?scene=tutor` (any `PLACE_ART` room: `kombat`,
  `center`...; `&biome=shrine` / `wastes`, or a Safari area) shows just that room's painted scene, without starting a run. `?area=wetland` (any Safari area, or a main biome: `?area=depths` walks the Crystal Depths;
  `&stage=0-3`, `&kind=boss`) shows that area's scene the same way, and each tap walks on a floor (11 an area, the boss's last), then the next area (`peekSafari()` in `js/main.js`); each area opens with its intro film and each new place with its walk-on (`js/safari-intro.js`; `&intro=0` skips them); the boss's place then plays its boss prelude (a tap replays it, a tap on the label walks on). `?gate=380` shows the Sealed Gate at that HP; `?strike=120&gate=50` plays its attack scene (here, the
  break that frees Mewtwo) after PRESS START; `?gate=0&strike=0` the open gate throwing your Pokémon back. Neither is saved.

- **The Clearing's PC** (2026-10-09, the user's ask; finished the same day): right of the plaza (`PC_AT`; a real 3D model since 2026-10-09, the user's ask, `pcModel()` in `js/hub-pc.js`, its screen's scan lines rolling, `livePc()`; was `pcArt()` in
  `js/hub-3d.js`, after Pokopia's Pokémon Center PC), a tap logs on to `js/pc.js`, full screen over the hub: Gen 3's menu,
  the Mailbox (the big PokéCoin prizes, Pokédex / bonus / Safari pages, the whole Pokédex, a type's first Level 5 jackpot, feats' coins, are posted there as letters by `post()` in `js/mail.js`, `save.mail`, and claimed with a little moment: the envelope opens, the letter rises, the coins count up; an envelope bobs over the PC while one waits, `pcMail` in `js/hub-3d.js`; with the Signs title they're paid at once; `?mail` drops sample letters into an empty mailbox), Walking buddy and Base residents (straight off the menu since 2026-10-11, the user's ask; Bill's PC held them; both pickers say the buddy and the Pokédex partner differ), your PC (Rename, the same nickname as Settings'), Prof. Oak's PC (the Pokédex rating, a bar per page and a Next unlock card cycling hints, `rating()` / `hints()`), Decorations (your PC's: the base's furniture, in the room or in storage, Put away; every base owns one Storage PC, `FREE_PC` in `js/secret-base.js`, which tapped in the room opens it there, `logOn()` in `js/base-3d.js`), Sign in / Cloud save (the cloud save's window, `openCloud()`; the title corner's Sign in PC is hidden in hub mode since, `#title-account` in `css/hub.css`), the Hall of Fame / Record
  Book (the device's app, `onApp`) and Exit PC (was Log off) (`pc-on` / `pc-off`). **The walking buddy is not the Pokédex's partner**
  (the user's call): `buddy()` / `buddyChoices()` in `js/trainercard.js`, the save's `buddy`, only first forms of owned
  starters, no legendaries (too big to walk about), shinies once bought; the Clearing, the Secret Base and the Poké Mall
  all walk it, `partner()` stays the cover's, ID strip's and Trainer Card's. Logging off swaps it in place (`swapBuddy()`).
  Base residents write `secretBase.mons` (`residents()`, `RESIDENTS` 6, shared with `js/base-3d.js`).
- **Daily and weekly missions** (2026-10-11, the user's ask: more ways to earn PokéCoins; balanced the same day, the
  user's call "all worked out and balanced"): 3 a UTC day and 3 a week (its Monday, the Sky Pillar's), one per `tier`
  (easy / medium / hard, paying `TIER_COINS` 30 / 45 / 65 a day, 200 / 250 / 300 a week; all three claimed pays `BONUS`
  60 / 250), rolled from the date's seed out of the pool open to that save (`needs`: Safari / Sky Pillar / crossroads /
  Level 3 / a skin wait for it), never two on one event or one `group` (type-locked goals, bosses, modes, a week's run
  wins); `DAILY` / `WEEKLY` / `rollMissions()` in `js/data/missions.js`, pure, `tests/missions.test.mjs` (every roll is
  one a tier; every `on` is sent by the game). Goals were set from the human-like bot at Level 0 (150 runs a type, a
  scratch copy of pokeDB-sim counting Burn / Tide / Seed / Powers / exhausts / biggest hit / turns a fight): easy is done
  in a first biome, medium about a run into biome 2, hard one good run (the numbers are in the comment over `DAILY`).
  `track()` in `js/missions.js` counts play from `mission()` in `js/run.js` (never on a peeked run); a fight's in
  `collect()` (a refresh replays the fight), from battle's `tally` (`burn` / `seed` / `powers` / `exhausted`, and
  `tallyOf()`'s `tide`); a mission's `distinct(ctx)` counts each type or day once. Saved in `save.missions`; a roll
  holding an id taken out of the pool is rolled again. Claimed at the Clearing's PC (MISSIONS, `questRow()` in
  `js/pc.js`), whose "!" stays while one waits (`pcBeckons()`); with the Signs title they're paid at once. A new mission
  is a pool line in a tier (its `on` event fed by a `mission()` call).
- **House upgrades** (2026-10-10, the user's ask after WoW's housing blueprint): the PC's HOUSE UPGRADES page draws the Secret
  Base from above (`blueprint()` in `js/pc.js`: grey rooms, Entry under the main room, a tab per floor, `floor`). First the main
  room grows 11x8 to 14x10 (`BIG_PRICE` 500, `buyBigRoom()`), with no doorways of its own (the user's call: they're the
  blueprint's to place). Then as many rooms as you like (no cap, the user's call), `ROOM_PRICE` 500 each: a green pip on any
  tile of any wall builds one there (every kind has a pip on every edge tile but the corners, generated after its authored
  ones so saved links' pip indices hold), Turn cycling its fits (`fitsOf()`, one per footprint); closet, hallway, bedroom,
  den, L-shaped, cross-shaped, great hall (`ROOM_KINDS` in `js/data/house.js`; `tests/house.test.mjs`). A new room joins only
  where it was built; a gold pip opens a doorway between two rooms already wall to wall (`joinPips()` / `buyDoor()`,
  `DOOR_PRICE` 100). Upstairs: on a floor's tab the floor below shows faint, green pips on its back walls build a room a
  floor up (`lv`, `fitRoom(…, up)`), a link ending `'up'`, walked as a staircase (steps up into the back wall, the top of a
  flight going down in the room above; `addDoor()` in `js/base-3d.js`), its title "Bedroom · 2F". A tapped room can be taken
  down (`takeDown()` / `removeRoom()`: never the main room or one others are only reached through; its furniture is back in
  storage, which is what you own less what stands in rooms; no refund). The plan is
  `secretBase.house`. Each room is walked as its own diorama (the user's pick over one open dollhouse): doorways are a
  dark way through a wall or a doormat on the front edge, a tap walks your partner through and `travel()` in
  `js/base-3d.js` builds the next room. The room you're in keeps its things on the base itself (`items` / `wall` /
  `floor`, `here`), the others on their records (`goRoom()` / `roomContents()` in `js/secret-base.js`), so anything
  outside the room counts every room's (`allItems()`, `eachRoom()`); `useRoom()` sets the live `COLS` / `ROWS` and the
  floor mask, walls and doorways `fits()` reads. Opening the base always starts in the main room. A new doorway clears
  its furniture into storage (`clearDoors()`). **Duplicate** (the same day): the PC's DUPLICATE copies any owned piece into
  storage, 50 PokéCoins, +5 a copy, never over 100 (`dupePrice()` / `duplicate()`, `secretBase.dupes`). New things to
  read in the PC wear a bobbing gold "!" (`freshMark()`, `.pc-new`), not a "(NEW)". The FRIENDS row (2026-10-16) is no page: it logs off and opens the Pokédex's Friends app, with that app's "!" (`docs/reference/towns.md`'s Friends app). A new PC page also gets a `NEWS` line in `js/pc-news.js` (per device, `pokedb.pcSeen`): its row, the menu holding it and the PC over the hub (`pcMarks()`) wear the "!" until it is opened once (2026-10-10, the user's ask: House Upgrades and Duplicate shipped with none).
- **The backyard** (2026-10-14, part a of docs/roadmap.md's backyard, the user's picks): a green plot behind the main room on
  the HOUSE UPGRADES blueprint (its own BACKYARD tab since 2026-10-16, below), dashed till bought; a tap shows its
  card, Build for `YARD_PRICE` 1,000 (`buyYard()` in `js/secret-base.js`), at any main-room size. Saved as
  `secretBase.house.yard` `{ size, items, wall, floor }` (`size` 2 the bigger yard, part e), its things packed there
  like a room's (`roomContents()` / `goRoom()` / `eachRoom()`). It is not one of `houseRooms()`, so nothing is built onto
  it or counted on the grid; `roomById(house, 'yard')` (`yardOf()`) reaches it, kind `yard` (12 x 8, `outdoor`) in
  `ROOM_KINDS`. Walked in `js/base-3d.js` like any room, on the base's own renderer (no new GL context): `buildYard()`
  lays a mown lawn and the Clearing's meadow running on under the view, a picket fence on three sides, the Clearing's trees and bushes (`treeArt()` / `bushArt()`,
  exported from `js/hub-3d.js` with `CLEARING_LOOK` / `CLEARING_LIGHT`) in their season's leaves, stepping stones, and
  in winter snow on all of it and falling (`liveSnow()`); `yardLight()` is the Clearing's light and tint under a sky
  gradient. The lawn rolls away like the Clearing (`BEND`, `CURVE` outdoors and 0 indoors; taps find the drawn ground with
  `groundHit()`, the doormat included). Residents are out there only when let out (part c, below). `?yard` opens
  straight out there, a yard lent for the page load if none is bought (`lent`, taken back by `loadBase()` on any load
  without it). The PC's `NEWS` has `yard` (in House upgrades).
- **The backyard's furniture** (2026-10-14, part b): the Yard shelf, 16 kinds flagged `outdoor` (`p.outdoor`), painted
  in `js/base-furniture-yard.js` (the tray's and store's pictures only) and modelled from parts in `js/base-models-y.js`.
  `fitsHere(id, b)` in `js/secret-base.js` is the rule (the user's): an outdoor piece only in the yard, nothing from
  indoors out there; `fits()`, the tray and its chips all ask it. A new outdoor kind is a line there with `outdoor` (its
  `add()` sets it) and a builder in the -y batch. Sold only in **Smeargle's garden catalogue** (`js/garden-shop.js`): a tap
  on Smeargle in the store, once there's a yard (`KEEPERS[1].special` in `js/mall-furniture.js`; without one Smeargle
  chats, a line hinting at it), the whole shelf always in stock, owned ones marked; `dealDay()` leaves outdoor pieces out,
  so the daily stands deal as before. Since 2026-10-17 (the user's ask: "all pixels", "some kind of merchant window") the catalogue is a merchant's card in the store buy window's look (`.gmerch` in css/hub.css): green ribbon tabs, each tile a still of the piece's 3D model (`pieceTurntable()` in `js/mall-furniture.js`, drawn once by the shared turntable, then disposed; only the 2D still is kept), and a tap opens a buy window with it turning (`turner()` in `js/turntable.js`, which the Furniture store's `merchant()` uses too). Outdoors only the Furniture tab shows (`.base3d.outdoors .b3-tab`); pieces, the
  ghost, its footprint and the pick box roll with the lawn (`bendOut()`, `bend()` on `foot` / `selBox`, a no-op indoors),
  and a held piece aims at the lawn as drawn (`groundHit()` in `aimFrom()`). Seats (bench, picnic bench, lounger) carry
  a shape `seat` for part c. The lamp post and string lights switch (`light`), the barbecue burns (`fire`).
- **Pokémon out in the yard** (2026-10-14, part c): outdoors the sheet shows the Pokémon tab as well as Furniture
  (`.base3d.outdoors .b3-tab`); there it lists the residents on show, a tap letting one out or calling it in
  (`secretBase.out`, `letOut()` in `js/base-3d.js`; the indoor tab tags those out "Yard", and taking one off show drops
  it from `out`). `livesOut()` / `homeHere()` / `present()`: a guest is drawn, lives, blocks tiles and takes taps only
  in its own place (the yard, or whichever room indoors). `YARD_SEATS` / `YARD_SPOTS` say what each yard piece is for and
  where on it a Pokémon goes (in the piece's frame, turned with it by `seatSpots()`): the swing set's two swings, the
  picnic bench's four places on its benches, two in the rock pond and the inflatable pool. `seatsFor()`: a Water type
  (`ENEMY_DEFS[id].type`) takes only the water where there is a pond or pool, the rest anything but; your partner sits
  and swings but never swims. Each swing is its own part (`K.part(name, pivot)` in `js/base-mesh.js`, found at
  `model.userData.parts`), swung by `liveSwings()` higher while someone's on it, carrying them, and a swimmer bobs with
  droplets (`splash()`, puff kind `drop`) as it dives in and climbs out.
- **The berry garden** (2026-10-14, part d): the rules are `js/data/berries.js` (no DOM; `tests/berries.test.mjs`), the
  3D side and window `js/berry-garden.js`. A `berryplot` (Yard shelf, flat, modelled in `js/base-models-y.js`) holds its
  crop on its item, `it.crop` `{ id, at, ready }` (`sow()`: ripe on the UTC midnight `days` after planting; `stageOf()`
  sprout for the first half, bloom, fruit). Moving a plot keeps it (`place()` copies `holding.back.crop`); storing it
  loses it. In Walk a tap on a plot opens `openPlot()` (the town shop's `.dev-window` look): plant, Dig up, or Pick.
  `harvest()` books it on `secretBase.garden` `{ picked, day, coins }`: the first of a berry earns its basket (the
  `berry` source in `js/data/furniture.js`, indoor kinds `<berry>basket`, `solo`). `tendPlot()` (from `makePiece()`) lays the plant, merged meshes cached per berry and stage, and a "!"
  sprite on a ripe plot; `liveGarden()` (each frame) bobs the "!" where the lawn's bend draws it and every 5 s swaps a
  plant whose stage turned over (at once after the window changes one).
  **Berries to the Satchel, watering and selling** (2026-10-15, the user's ask, for Kurt's Workshop): picking no longer
  pays coins; `harvest()` returns `{ berry, n, basket }` and the caller puts the `n` in the Satchel (`gainMat()`; the five
  are `MATERIALS` with `biome: 'garden'`, `grown: true`, never dropped in a run; the Satchel app files them under
  "Backyard", "Grown in your backyard's berry plots."). A growing crop takes water once a UTC day (`water()` /
  `canWater()` / `wetToday()`, the days on `it.crop.wet`), and `yieldOf()` is 1 berry plus 1 a watered day. The plot
  window offers Water (greyed "Watered today" once done) beside Dig up; a watered plot's soil is darker today in 3D (one
  shared see-through sheet over the furrows, `wetSoil()`, laid and dried by `dress()`, so `liveGarden()` dries it when
  the day turns) and wears a blue drop on its window tile. Spares sell for their `coins` through `sell(b, id, k)`:
  whole berries only, the stand's `DAY_CAP` (100) a UTC day still on `secretBase.garden`; the caller takes them out with
  `gainMat(id, -n)`.
- **The Garden window** (2026-10-15, the user's ask): out in the yard with a plot placed, a green Garden key stands
  right of Decorate (`.b3-garden`, `.has-garden` moves Decorate over; `tendGarden()` / `plotsHere()` in
  `js/base-3d.js`). `openGarden(b, plots, save, at)` in `js/berry-garden.js`; a tap on a plot in the yard opens the same
  window on that plot (no separate plot window since 2026-10-17). **Built on Kurt's bench since 2026-10-17** (the user's
  ask, after a day as a wood-and-parchment MMO window that broke on phones: "closer to Kurt's window"): it reuses the
  Workshop's `craft-*` classes (`css/screens.css`) as `.dialog.craft.garden`, with only its extras in
  `css/secret-base.css` (`.gd-*`). Smeargle's line on the red tag says what just happened or, idle, what to do next
  (`hint()`); the "?" swaps it for HOW TO GARDEN, four one-line steps (`gardenHelp()`, shown by itself the first time
  per device, `firstLook('garden')`). Three tabs: **Plots** (a green dot: ripe + thirsty plots), the list sorted ripe,
  thirsty, growing, empty (`plotRank()`), the card a plot's stage, its held effect, Growth / Water / Harvest chips and
  one big button (Pick! / Water it / Plant a seed, which opens Seeds aimed at that plot), with Pick all, Water all and
  Dig up as small keys under it; **Seeds**, the card a berry's days, price, `short` effect, its full held text and the
  run kit Kurt crafts once `workshopOpen()`, then Plant here / Plant in N empty; **Sell**, the card today's pay and Sell 1
  / Sell all. No `scrollIntoView` (it can shove the whole page on an iPhone): the card stays put over the list. Each
  change saves the base and sets `nextLook = 0`, so the 3D plants change at once.
- **Smeargle in the yard** (2026-10-15, the user's ask): the first time out in a bought yard (since 2026-10-16, the user's
  failsafe: whether or not the housewarming indoors has happened, since the arch leads out here first; if not, it says
  hello as a stranger, says the shop opens tomorrow and calls `meetSmeargle()` itself; a yard bought before the intro
  existed has no `met`, so it plays on the next visit), `yardIntro()` in `js/base-3d.js` (from `startVisit()`) has
  Smeargle slide in on `gymTalk()` (lit, plate PAINTER & GARDENER, its cry) and say what the yard is for: furnishing it
  from the garden catalogue, storage and Furniture, the Pokémon tab, the Berry plot it leaves in storage, the berries'
  days and UTC midnight, watering, the Satchel and the Garden key's selling, and Kurt's Workshop by name only once
  `workshopOpen()` (else someone handy in the Clearing, someday). Taps and walking wait meanwhile (`yardTalk`). The gift
  is `house.yard.plot` (1), counted by `owns()` in `js/secret-base.js` (`YARD_GIFT`), and heard is `house.yard.met`
  (`metInYard()` / `meetInYard()`); a lent `?yard` hears it once a page load, any time, and its plot goes with the lent
  yard, so neither reaches a real save.
- **The BACKYARD tab** (2026-10-16, the user's ask: over 1F the yard sat where a room built off the back wall went, and
  the Build key hid under the text window): HOUSE UPGRADES has a tab after the floors (`yardTab`), the yard drawn alone
  with its Arch under the front edge (`yardPlan()`, on the shared `sheet()`), its card always shown under it, no tap
  needed. 1F draws only the house. Every page's Build key sits in `.pc-act`, sticky at the foot of the scroll.
- **The bigger yard** (2026-10-15, part e): the bought yard's BACKYARD tab (`canGrowYard()` in `js/pc.js`) shows
  BIGGER BACKYARD, the new lawn dashed round the yard; `buyBigYard()` in `js/secret-base.js`
  (`BIG_YARD_PRICE` 1,000 in `js/data/house.js`) sets `house.yard.size` 2, the `bigyard` kind (16 x 11, `yardKind()`;
  `yardOf()` reads it), and moves the yard's things 2 across and 3 back, so they keep their places by the doormat
  (always the middle of the front edge). `buildYard()` sizes all it draws from `COLS` / `ROWS`, winter's snow too.
  `?yard=big` lends the bigger one.
- **The Ancient Tree's picket fence and garden gate** (2026-10-15, the user's ask, then their drawing the same day):
  `treeFence()` in `js/hub-3d.js`, painted like the gate, merged with `mergeStatic()`: a row behind the tree
  (`FENCE_BACK`, row 1), down its left side on column `FENCE_LEFT` (18) to its foot, down the right on `FENCE_RIGHT` (27),
  and along the front (row 4) from either side of the trunk to those corners (the left's front added the same day, the user's ask), the gate (`ARCH_AT` 25,4, moved from 27,3) in it just right
  of the trunk; the tree's own tiles stop short of the gate's. The gate (`js/hub-arch.js`) was restyled white to match:
  square posts, a latticed arch with a finial, the picket gate and lantern; no ivy or flowers (the user found the
  overgrown arch a clump). Its tiles go in `dressTiles`.
- **The garden arch, the backyard's way in** (2026-10-15, the user's ask: "the entrance to the backyard from outside,
  an archway you unlock"; it was a back door of the main room, `backDoorOf()`, now gone, so every main-room wall can be
  built onto again): the Clearing's place `backyard` on `ARCH_AT` (27, 3; drawn `ARCH_X` 0.3 left, blocking it and the
  tile left of it), between the Ancient Tree and the Sky Pillar's trail, doorstep the tile below. `makeGardenArch()` in
  `js/hub-arch.js`, in 3D: a wooden trellis arch on stone footings, ivy and flowers over it (snow in winter), a picket
  gate whose two leaves swing in (`swing()`), a lantern under the crown lit with the hour (`glows`), and an arch-shaped
  plane behind the gate showing the yard's lawn and fence (dimmed after dusk), or a dark thicket while locked. Locked
  (no bought yard): brambles across it and a padlock on the gate; its card asks for the Secret Base first, then offers
  Unlock for `YARD_PRICE` (`buyYardArch()` in `js/hub-3d.js`, the same `buyYard()`); bought, the brambles wither and the
  lock drops (`clear()`) and you walk in. Buying it on the PC's blueprint opens it too (the hub rebuilds its places when
  the PC logs off). Go in (`enterYard()`): the gate swings in, your partner walks through, and `acts.onBase('yard')`
  opens the base out in the yard (`openBase3d({ start })`); `inside` is `'backyard'`, so the yard's doormat (now an
  `exit` door in `doorsOf()`, like the main room's front door) brings you back out under the arch (`leftPlace()`). The
  main room and the yard no longer join: the tree's door leads to the house, the arch to the yard.
  Since 2026-10-16 (the user's call) the yard is only for a bought Secret Base (`baseOwned`, not just base data on the
  save): `buyYard()` refuses without it, a tap on the locked arch says so (`lockedArch()` in `js/hub-3d.js`), and the PC's
  BACKYARD card shows no Build button.
- **Secret Base earned furniture** (part c, 2026-10-09; on `secret-base` only until the user says): `js/data/furniture.js`
  names 39 catalogue kinds (family ids from `js/base-furniture*.js`) that are never sold, each `from` one badge /
  achievement (its starter) / feat / Safari page, owned once that is (`earnedFurniture(save)`: the save's lists never
  shrink, so nothing is saved; `owns()` in `js/secret-base.js` adds one to `owned[kind]`, every colour with it). The daily
  stock skips them (`furnitureStock()`); the Shop tab lists the unearned after the stock, greyed with an "Earn" tag, a
  tap saying how (`lockedEarned()`, `howToEarn()`; a secret source's piece is a black "???"). A new earned kind's source
  must be unique (`tests/furniture.test.mjs`). The base is decoration only, one room that grows, 6 Pokémon on show (the
  user's calls, 2026-10-09). **Live since 2026-10-09** (the user's call): `secret-base` was
  merged into `main`, the Clearing, Secret Base and Poké Mall with it; work goes to `main` again like everything else.
  **Friends' pieces** (2026-10-15, docs/roadmap.md step 8 session d): source `heart` (`'john:3'`), owned while that friend's
  hearts reach the number, so an old save already there has them on load; `?hearts=N` lends them for the page load
  (`earnSave()` in `js/secret-base.js`). Their catalogue is `js/base-furniture-friends.js` (`FRIEND_KINDS`, group
  Friends, `solo`: one colour each, the friend's own), their models `js/base-models-friends.js` (each modelled, none
  carved from its painting; the chair nobody sits in has no `seat` on purpose).

- **Meowth opens the Poké Mall's Game Corner** (2026-10-11, the user's asks; live on `main` since
  that day): the crossroads open after one won run (`ROADS_WINS` 1), and at the first one a save reaches Meowth trots
  in and talks (it has quit Team Rocket and means to earn its coins honestly) (`js/meowth.js`, `meowthTalk()`, `meowth` in `crossroads()` / `crossroads3d()`), then saves `cornerOpen`,
  which takes the tape off the mall's Game Corner front (`syncShop()` in `js/mall-3d.js`) and puts up its ribbon, Meowth
  beside it (a `RIBBONS` line like Smeargle's, saved `cornerRibbon`; `?ribbon` shows both). Every save meets it, old ones
  at their next crossroads (the user's call: everyone should witness Meowth); the Game Corner app is open to all from the
  start. `?meowth` shuts the shop again; `?crossroads&meowth` plays the talk.

- **The Clearing's layout** (2026-10-14, branch `towns`; the user's ask: everything spread out, wide roads setting off the
  plaza, the way out going north, Kenmatta away from the Nietos, the Secret Base moved): this supersedes the positions
  named above. A 31 x 21 grid (`COLS` / `ROWS`, the plaza's middle the world's origin, `X0` / `Z0`): a round paved plaza
  (`PLAZA_R`, stones in rings, a Poké Ball laid in the middle under the Waystone, `plaza()` in `groundArt()`), four
  cobbled avenues off it and a stone ring road round them, earth trails out to the wild places (`ROADS` / `RINGS`, `dirt`;
  `STONE` the paving's colours); the Whispering Clearing's gate at the north avenue's end (`GATE_AT`, a stretch of fence
  either side, `FENCES`; made grander 2026-10-14, the user's ask "cleaner, more extravagant and noticeable": 84 x 100
  painted px, a gold-rayed leaf crest on a green-shingled roof, lanterns off its tips, teal banners, carved stone feet with
  glowing runes, `clearingGateArt()`; its opening shimmers and motes rise out of it, `gateVeilArt()` / `liveGateway()`, and
  a teal lamp lights the ground before it after dark; Halloween's hay there taken out as clutter), New game's Pokéstop
  and the route sign just inside it, since 2026-10-15 right beside the gate's posts, one each side, just outside its feet so neither hides their runes (`STOP_AT` / `SIGN_AT`, nudged in by `STAND_IN`; the user's ask; on 2026-10-14 they stood a row or two forward, the orange tree behind the stop taken out). The signs that are places of their own (the route sign, the Safari's and the Sky Pillar's boards, the Nietos' name board) hop and wiggle every few seconds, a gold glint twinkling at their corner, so they read as something to tap (`beckon()` / `liveBeckons()`, 2026-10-15, the user's ask; still when calm). The jack-o'-lanterns at the gate's feet were taken out the same day; setting out walks
  your partner north under it and off into the painted view (`walkOut()`), and it walks in that way (`enterHub()`,
  `walkBackIn()`); the Safari gate (a real 3D model since 2026-10-15, the user's ask "so bland": `safariGate()` in `js/hub-safari.js`, lashed log towers on river-stone feet under thatched cones and waving pennants, a thatched roof between them over the SAFARI ZONE board, a swaying Safari Ball crest fanned with fronds, lanterns and bunting, tiki torches and a warm lamp (`lamps`' `safari`, off while shut), palms, ferns and a bamboo palisade out to the log fence at `WING_X`; shut, a red rope and CLOSED plank, nothing lit) and the Sky Pillar in the back corners up trails off the ring road (the Pillar since 2026-10-15, the user's ask for "a big change": Hoenn's tower in 3D, `js/hub-pillar.js`'s `makePillar()`, four octagonal tiers of sage stone under jade rune bands, a porch with Rayquaza's ring, banners, floating stones, two collars of cloud and a jade crystal over broken columns on top; its top at about 9.9, kept that low so a phone's view at its door still takes in the crystal (an iPad's shows only the first 5 or so); asleep, runes and crystal dark and no wind, until a won run opens it (`towerOpen()`)), the open meadow
  behind (`MEADOW`) and the view across the whole back with both roads in it (`vistaSpan()`, `vistaArt(time, w, roads)`);
  Kenmatta's dojo north-west (`DOJO_AT`; since 2026-10-15 at 6,0, a tile clear of the Safari trail (the user: "crammed"), its cherry trees taken out ("they look stupid"), five tiles wide and open: `js/hub-dojo.js` outside, its door into `buildDojoHall()` like the Nietos' house), the Clearing four tiles wider on the west (`WEST`, its margin `MW`; walkable grass to the forest, the meadow and Safari fence out with it) and the Safari gate moved out there (`SAFARI_AT` 1,-3), its Pokéstop three tiles left and its ranks board three right where the trail from the ring road turns west to it (2026-10-15, the user's asks: one tile off the 3D gate, the stop stood in its mouth), a fence and copse (`GAP_TREES`) closing the meadow between the Safari gate and the Clearing's (2026-10-14, the user's ask), the Pokéstops' words (CONTINUE / SET OUT...) over their discs, turning with them (`stopCue()`, 2026-10-14; they lay on the ground before),, the Ancient Tree / Secret Base north-east (`TREE_AT`; kept a tree, the user
  asked: like Gen 3's Secret Power bases), the Poké Mall south-west and the Nietos' house south-east, both
  facing the camera, their doorsteps down to the low road to the pond (`MALL_TILE`, `NIETOS_AT`; moved 2026-10-14 from
  the user's drawing, Halloween's pumpkin patch taking the house's old spot; moved down again the same day onto the low road,
  the road they used to face taken out: the user meant that road moved, not a second one), the PC east of the plaza facing straight
  at the camera (`PC_AT`, no longer turned), a pond garden at the south avenue's end (a duck paddling round it, `liveDuck()`, 2026-10-14), below the ring road (`POND`; moved down 2026-10-14 from the user's drawing, the
  Clearing grown to 31 x 26 and the plaza a row lower for room round it, a low road from the ring road's sides, its
  south side, running into the pond at `POND.y`), the Sealed Gate once broken at
  the west avenue's end, where the mall stood (`SEALED_AT`); lamps, benches and flower beds (`LAMPS` / `BENCHES` / `BEDS`,
  `dressClearing()`, their tiles `dressTiles`; laid out in mirrored pairs across the north avenue 2026-10-15, the user's
  ask, each bench turned to what it's by); a hedge along the front. Tall things stand at the back, so nothing hides
  your partner. The sun's shadow box follows the view (`followSun()`). `?aerial` shows it all from high above, `?hubat=x,y`
  starts your partner on that tile.

- **The professors** (2026-10-15, the user's ask, with two reference sprites): the place `prof` on `PROF_AT` (the tile
  just right of the PC, the user's ask the same day; it first stood two right of the Waystone, and Halloween's ghost
  that spawned there moved to that old spot). Professor Oak stands there except at night, Professor Sonia
  at night (`PROFS`, `profNow()`; both boards are built and `setTime()` shows one). Each tap reads the next of `HINTS`
  (features a player might miss); every fifth tap ends on that professor's reminder to refresh the page for updates
  (`hintsHeard`; every tap until 2026-10-15, the user's ask). Sprites
  `assets/trainers/oak.png` / `sonia.png` (the user's own sprites since 2026-10-14, 80 x 80 like Kurt's; `monBoard()` finds their feet from the empty rows).
  A new feature worth a hint gets a `HINTS` line. **Talked to in the Gym Leaders' slide-in** (2026-10-15, the user's pick
  of two): `showCard()` hands the place to `profTalk()`, which calls `gymTalk()` (`js/gym.js`) with a leader-shaped
  `{ id, name: short, sprite }`, `lit`, `title: 'PROFESSOR '`. The first tap of a visit (`profGreeted`, reset in
  `showHub()`) slides them in over the dim with their `hello` and a hint; later taps are `bubble: true`, the speech
  window alone, so browsing hints stays quick. The refresh reminder is its own line.
- **Kurt's Workshop** (2026-10-14, towns on only): tiles 23-25 x 6-8 in the plaza's north-east, its door on a path to the
  east avenue. Halloween's pumpkin patch and scarecrow sit on the south-east lawn by the Nietos' house since 2026-10-15 (the user's ask: they crowded the Secret Base's door). Detail: `docs/reference/towns.md`.

- **The Nietos' house, a storybook cottage** (2026-10-14, the user's ask: "more aesthetic than a stupid bland house"):
  `nietosHouse(g, x, z, home)` in `js/hub-3d.js`. Its paintings are made once in `cottageArt()` (butter-cream clapboard,
  scalloped baby-blue shingles drawn eave-up so each row laps the one below, a stone footing, bricks, a fanlit four-panel
  door and pink-curtained windows whose glass glows through `shine()`, heart-cut shutters, baby Linc's washing, an OUT!
  note). Roof slopes come from one `slope()` helper (shingles, barge boards, fascia; the porch's own gable reuses it turned
  side-on, its shingles scaled down by the texture's `repeat`). The OUT! note is on the door while `home` (`nietosHome()`)
  is false. Chimney smoke is five puffs moved in `liveSmoke()`. Pickets, flower tufts and blooms are `InstancedMesh`es,
  and `mergeStatic()` bakes the rest that share a material into one mesh each (117 meshes down to 53: draw calls on a
  phone). Outside its 3 x 3 it stands on `NIETOS_YARD` (the name board and washing line west, the fenced garden either
  side of the doorstep, the pram and sandbox east), added to the place's tiles so nothing walks through it.
- **The Nietos' name board** (2026-10-14, the user's ask: fix it, bring it closer, stop its sticks sticking out, make it
  readable): `nietosSign()`, its own place `nietos-sign` on yard tile [-1, 2] (doorstep the tile south of it), so a tap
  isn't swallowed by the house's merged meshes and shows its card's line. It stands at the garden's front left, turned
  0.3 rad to the path; its posts sit at the board's ends behind it and stop under its roof (inside its width they poked
  through the face).

- **Cracks where the Sealed Gate will stand** (2026-10-14, the user's ask: foreshadow the portal, with words vaguely
  saying what's happening): while the gate isn't broken (`gateOpen()`), a place `cracks` on `SEALED_AT` (its tile blocked,
  step the tile south) built by `makeCracks()` in `js/hub-cracks.js`: a flat painted decal (one canvas, drawn again
  additive with a breathing opacity), violet crystal shards from stage 1, rising sparks, and whispers (`WHISPERS`) that
  drift up over it in turn while your partner is within 4.5 units. All of it grows with `gateStage(gateHp())` (0 to 3, the
  same seed so the cracks spread rather than move); its card's line is `CRACK_LINES[stage]`. `?gate=N` shows a stage.
- **The broken Sealed Gate, in 3D** (2026-10-15, the user's ask: "the HD 3D update, not the paper thin pixel version"; it
  was js/gate.js's open-arch painting on a plane): `makeSealedGate()` in `js/hub-sealed.js`, the place `gate` on
  `SEALED_AT` once `gateOpen()`. The painting's design in the round: a bevelled obsidian arch (an extruded U) on a
  three-step dais, gold piping and impost bands, violet runes along its band (three dark) and glowing cracks, a magenta
  crown gem between two gold horns, an ice-crystal spire and shards either side. The opening is the Depths: a violet well
  (`wellArt()`) under two additive vortex layers (`swirlArt()`, turned by their texture's rotation, UVs square round the
  heart so they turn round), light pooled on the dais and the ground. The door's shards float round it, the snapped
  chains sway, motes rise; `tick(now, glow, calm)` brightens it after dark and holds still when calm. Its still meshes go
  through `mergeStatic()` (117 meshes to 25). No lamp of its own (a light recompiles the scene's shaders).
- **The backdrop** (2026-10-14, the user's phone shots: grey past the view's top and its east end): the vista spans the
  whole back, `-M - 8` to `COLS + M + 8` (`vistaSpan()`), and its plane runs `SKY_UP` (40) units past the painting, the
  UVs there sampling the painting's top row (plain sky; the texture is clamped, so the stars keep off that row). The
  east-side `TREE_TILES` were taken out the same day.

- **The Trainer Plaza's board and the quest board** (2026-10-17, the user's marks on an aerial shot): at the plaza's top
  corners either side of the north avenue, each turned to face the plaza (`facePlaza()`): `PLAZA_AT` 17.5,8.4 (between
  the avenue and the PC; `js/hub-plaza.js`, docs/reference/cloud-save.md's Trainers section) and `QUEST_AT` 12.5,8.4
  (moved from 11,10). Each is `{ at, tiles, step }`, `at` in fractional tiles.

### The rolling-log bend (on by default, 2026-10-14)

The user's ask: Animal Crossing's curved world, in the Clearing only. Tried behind `?curve=N` at 1, 2 and 3 on a branch,
the user picked 3, now `CURVE_AT`, the default. `CURVE` is N x 0.01 (`?curve=N` tries another, `?curve=0` lays it flat;
off under `?aerial`), and `bendAll()` runs every material in the
Clearing through `bend()` in `js/hd2d.js` once (at build, then each frame for whatever was added since). Each vertex drops
by k x (its world z minus the view's focus `camZ`)², applied to `mvPosition` after `project_vertex`, so shadows and lights,
worked out from the unbent world, still fall right. A material marked `userData.upright` (every `monBoard()` billboard,
through `feetDepth()`, and the painted vista, whose origin moved to its foot for this) drops whole by its origin's drop,
so a sprite stays flat and upright, and `feetDepth()`'s upright depth is worked out from the bent feet and pixel
(`BEND_DROP`). The bend only moves what's drawn, so a tap follows the screen's ray in 1.5-unit pieces, each put back
unbent (`unbend()`), against the places and the ground (`tapRays()`, `groundTile()`). Shadow depth materials stay unbent
on purpose. A big box or plane (the ground, the meadow) is built again cut into tile-sized cells (`bendFine()`), as the bend
moves only corners: the first playtest had the ground sink as one slab under everything (2026-10-14).

- **Main menu from inside the Mall or Secret Base** (2026-10-14, the user found a black screen with the Clearing still talking): the Pokédex dock's Main menu leaves through that place's own door (its exported `leave()`, from `menu` in `initCollection()` in `js/main.js`), so its 3D layer is removed and dropped before home comes up. The run rooms (Center, Mart, ? rooms, arena) put their 3D away only once their screen is hidden, so `showHome()` in `js/title.js` shows `start-screen` under the title, as a fresh boot does.
- **Only the door opens the Secret Base** (2026-10-15, the user's ask): the Ancient Tree's billboard takes a tap only on its door and frame (`doorOnly()` / `DOOR_UV` in `js/hub-3d.js`, in `ancientArt()`'s painting coordinates), and the "Home" sign over it takes none, so a tap on the crown or trunk walks there like the ground.
- **The Poké Mall's outside made grand** (2026-10-15, the user's ask: "more grand and extravagant on the outside"): `mallBuilding()` in `js/hub-3d.js` keeps its 3.5 x 2.5 block and tiles, and adds a gold-ribbed glass dome on a lit drum with a turning Poké Ball on its spire (the old glass pyramid gone), a tower with a gold cupola and flag at each front corner, a gold-posted roof balustrade, and a porch of twin white columns with a red entablature, a Poké Ball pediment and chasing bulbs, on a marble plinth with a red carpet, gold three-globe lamps either side. The painted front got a gold-framed sign ringed with bulbs, arched windows between gold pilasters, and its corners left plain for the towers; the Game Corner's sign moved right to clear the columns. Everything but the spire's ball is merged (`mergeStatic`); `mallFx.tick()` chases the bulbs and turns the ball (still under `calmFx`). The porch stays within the half-tile in front of the doors, where the partner stands.

### The Safari Outfitter (2026-10-15)

The mall's east front (`FRONTS` id `outfitter`, place `so`), so each shop is one thing coins buy: home, runs, the Safari.
`js/mall-outfitter.js` paints its hall front (`outfitterFront()`, `outfitterSign()`, `outfitterAwning()`; the 3D awning and
ball crates are `dressFronts()`'s last branch in `js/mall-hall.js`) and builds its lodge (`buildOutfitter()`); `js/mall-3d.js`
walks it and sells (`wareTap()`, `passTap()`, `thanks()`).
- **Open** once the Safari Zone is (`safariOpen()`; `?ribbon` opens it for a page load), taped shut before that with
  Kangaskhan's note; its first opening has a ribbon to cut (`RIBBONS.outfitter`, saved as `outfitterRibbon`).
- **The lodge** (made grand the same day, the user's ask: "way bigger", price cards they couldn't read, "more of a safari
  aesthetic", the wall's things overlapping): its own 21 x 13 (`COLS` / `ROWS`, door at the aisle's foot), the camera
  following you like the Game Corner and the Furniture store. Bamboo walls over wainscoting, log posts and a beam under a
  thatched eave. The back wall is three bays between posts (`BAYS`), each with one thing and nothing in front of it that
  reaches it: the Safari Zone's map over a jeep (`JEEP`) at the left, the savanna mural and the carved sign over
  Kangaskhan's counter (`COUNTER`, gear shelves behind) in the middle, the leaderboard (`BOARD`) at the right. Keep it that
  way: a new thing goes in a wing or on the floor, not on the wall.
- **The packs** stand on tree stumps down two wings (`STANDS`, sisal mats under each wing), the rest of the pack at the
  stump's back, each with a big lit price sign on a low easel in front (`priceArt()`: the name, the price, the pack and
  how many you carry; LOCKED / OWNED). Keep everything low: signs up on poles hid the stand behind them (2026-10-16, the
  user's phone shot), so the wings' rows are four apart and the Day Pass booth stands where nothing is behind it. A
  headless check projects every stand from nine camera spots and flags any nearer one covering a farther one. The balls are real spheres skinned by `SKINS` (x
  runs round the ball, 16 the front where its button is), turning (still under `calmFx()`).
- **The Day Pass** is a thatched bamboo booth up on a two-tier dais in the middle (`DAIS`, moved there 2026-10-16, the
  user's call: off by the door it was awkward), under a big gold DAY PASS ticket with a sandwich board on the dais's edge
  (2026-10-16, the user's ask: make it obvious; `passHeaderArt()`, `passBoardArt()`), its step two tiles out. Its screen
  shows `passState()`: `pass` once one is held today (even before the free try, which `safariAccess()` alone would still
  call `first`), `first`, or `locked`; a second tap buys one (`DAY_PASS`, `safari.pass`). **The Master Ball** floats over a
  velvet cushion on the right wing's fourth stump, a gold ring round it and a violet glow. **The board** chalks
  `safariTop(5)` (every 90 s while shown); a second tap opens `openLeaderboard(0, 'safari')`. Torches flank the door and the counter, palms (`hallKit()`) the corners.
- **Buy windows** (2026-10-16, the user's ask: the Furniture store's merchant window, no "tap again"): a tap on a stand
  opens `merchant()` in `js/mall-3d.js` (shared with the Furniture store, generalised to `{ ink, dept, name, note, price,
  preview, held }`) with `ballWindow()`: the ball turning on a cushion in its colour (`ballPreview()`, `INK`), what it does
  and how many you carry. The booth opens `passWindow()`: what a pass is, where today stands and its price, a gold ticket
  turning (`passPreview()`); once held, `held` shows "Yours today" and only OK. The board opens the leaderboard on one tap
  (`game.direct`). The Furniture store's lift asks for the second floor on its first tap too.
- All buys go through `cornerEntries('balls')` / `buyCorner()` in `js/shop.js`, the same as the Pokédex's Game Corner app
  and the Safari prep window's Buy, which still sell them too.
- **Tapping through your partner**: standing at a stand, `onTap()` takes a tap on your partner as one on the stand it
  stands at when that stand is behind it in the same ray (2026-10-15).
- **Headless**: under software GL, `ImageDecoder` crawls while the mall draws, so Kangaskhan's 135-frame GIF takes a minute
  to load; add `&gifjs` to a headless check (real devices are fine; `?mall=corner&ribbon` does the same with Meowth).
- **The Furniture store's buy window and price tags** (2026-10-16, the user's ask: a merchant window instead of "tap again", the piece turning and turnable, and legible prices): a tap on a plinth walks there and opens `merchant()` in `js/mall-3d.js` (`.mall-shop`, css/hub.css): the keeper's tag, the department on a ribbon in its `ink`, the name, the piece on a velvet turntable in a spotlit box (`piecePreview()` in `js/mall-furniture.js`, built by `pieceInto()`, the same builder as the plinths), how many styles come with it, the price and your coins (red when short), Buy / Not now; a tap outside is a no. It turns on its own; a drag turns it and tips it, a flick spins on and slows (`spinPiece()` / `spinBy()`). It draws through `js/turntable.js`, one small off-screen renderer shared with Meowth's prize counter (`js/prizes.js`), so a window never adds a WebGL context. The painted price cards are gone: each unsold stand's price is a DOM tag at its plinth's front (`priceTags()`, 13px pixel font with a coin, the department's colour on its border), placed each frame by projection, hidden under the buy window and once sold.
- **The Furniture store's lift moved to the head of the nave** (2026-10-16, the user's ask: "a better place", and their partner hidden going in): at the back right it stood behind the Plants stand, whose piece hid the lift's doors and your partner at them. `LIFT.x` is `NAVE` now, at the end of the carpet runner with nothing in front of it, 3 tiles wide with a 1.3-tile doorway (`DOORWAY`; a partner's sprite is wider than a tile, so the old 1-tile door clipped it in the car; the doors slide by `userData.slide`) and 2.0 tall, the store's crest painted on its shaft (`liftShaftArt()` takes the floor; `crest()` fits its name to the board). The counter moved left of it (`COUNTER` x 6, 3 wide, a CASHIER plaque over it, the keeper at tile 7), and right of it `GALLERY`: Smeargle's painting over a bench (`bench` added to `hallKit()`) between two topiaries. Checked headless by raycasting from the camera to your partner at the doors, in the car and after the ride: nothing in between.

- **The mall's draw calls cut** (2026-10-16, the user's ask: more fps in the mall, its shops and the arcade): measured per frame
  (draw calls, shadow pass included) hall 649 -> 453, Furniture 1F 532 -> 408, 2F 508 -> 399, Game Corner 739 -> 463, Outfitter
  309 -> 272. The palms (`palm()` in `js/mall-hall.js`, four in every room, 25 draws each) bake their trunk and crown with
  `mergeStatic()` (the crown still sways), the shop fronts merge what shares a material (the bulbs still chase on their three
  materials; the star finials stay apart), the chandeliers' gold parts are one mesh, and the Game Corner's cabinets and card
  tables and the Furniture store's showcased pieces go through `bakeColours()` in `js/hd2d.js` (a still model's plain-coloured
  parts in one mesh, colours on the vertices; only for models whose parts never move or change on their own). Every room
  drops shadows from pieces under 0.1 across (`smallNoShadow()`). Taps (a screen-wide ray grid) and colours (rendered pixels,
  hall / Game Corner / Outfitter / 2F) checked identical to before. The arcade games (`frame()` in `js/arcade-kit.js`) and
  Plinko cap at 60 fps like the 3D places; their draws were already cheap (~1 ms, no blurred draws in play). Second pass
  (same day, the user's yes): the fountain (all but its spreading rings), benches, lamps, columns and escalators (the steps
  stay one instanced mesh) in `js/mall-hall.js`, and in the Outfitter each ware's little balls and easel (the big ball
  turns, so it stays apart), the jeep and the Day Pass booth. Every ball of a kind now shares one set of materials
  (`ballLooks` in `js/mall-outfitter.js`: each had painted and uploaded its own skin). `mergeStatic()`'s `keepReceive`
  keeps a piece's own shadow-receiving (the balls take none; off by default, so the Clearing's merges are unchanged).
  Now hall 345, 1F 360, 2F 351, Game Corner 463, Outfitter 233 draws a frame; taps and colours checked as before.

### The Ranger Task Board (2026-10-16)

The user's ask: a board that tracks things for players ("catch 10 for a piece of furniture"), a tracker per task and a
claim, "cool and immersive when they pull it up"; no Pokémon dolls as rewards (the user's call). The tasks are
`TASKS` in `js/data/ranger.js` (pure, `tests/ranger.test.mjs`), 92 in three tabs (`TABS`): **Field Research** (different
Pokémon caught, each area's survey, each type, rare spawns), **Ball Mastery** (catches with each ball, the Master Ball,
every kind) and **Ranger Feats** (catches in all, most in a run, unhurt, first turn, at night, the Safari crossed, area
bosses, days in a row, days played). A task's progress is counted from the save: `safariDex.caught` for the Pokédex
ones, and `save.ranger.log` for the rest (`logCatch()` / `logDay()`, fed by `rangerCatch()` in `collect()`,
`rangerTick('bosses' | 'wins')` and `rangerDay()` in `beginSafari()`, all in `js/run.js`, never on a peeked run). The
log only starts counting from 2026-10-16, so ball, night, first-turn and unhurt tasks count from then; Pokédex tasks
count every catch ever made. Claimed ids are `save.ranger.claimed`.
- **Rewards** (`rewardText()`): PokéCoins (`awardCoins()`), a ball pack (`save.balls`), room for one more Safari catch to
  live in the Secret Base (`rangerSlots()`; `residentCap()` in `js/pc.js` is `RESIDENTS` plus it, read by the PC and
  `js/base-3d.js`), or a piece of the **Safari set** (`RANGER_FURNITURE`, painted in `js/base-furniture-safari.js`, earned
  through `js/data/furniture.js`'s `ranger` source: pennant, lantern, acacia, ball rack, rug, expedition map table, tent,
  jeep). Nothing helps a first try score higher, so the leaderboard stays fair. Each claim counts toward the **Ranger
  Ranks** (`RANKS`, Rookie to Master Ranger, `rankOf()`).
- **The board** (`openRangerBoard()` in `js/ranger.js`, its own modal `<dialog class="ranger-board">`, styles in
  `css/hub.css`): a cork board in a bamboo frame under a green plaque, the rank's badge and bar, three wooden tabs with a
  red count of ready tasks, then the notes: pinned, a little crooked, a Polaroid of the Pokémon (a silhouette till one is
  caught) or the ball, a paw-print trail and the reward. Ready first, then nearest to done, claimed last. A ready note
  wiggles (not under `calmFx()`); CLAIM slams a green RANGER ✓ stamp onto it and a toast says the reward and any rank up.
- **Where**: on the Outfitter's back wall over the jeep (`taskBoardArt()` in `js/mall-outfitter.js`, the left bay, a "!"
  bobbing over it while `rangerReady()`), the Safari lobby's **Tasks** key (`#sp-tasks`, a red count on it), and a line
  in a Safari run's result window when tasks wait.
- **Expeditions** (2026-10-16, the board's first tab): three goals a week, one a tier (easy / medium / hard paying
  `TIER_PAY` 200 / 350 / 600 PokéCoins) from `EXPEDITIONS`, rolled by `expeditionTasks(week)` from the week's seed (its
  Monday UTC, `expeditionWeek()`, the Sky Pillar's week), never two of one `group`; a fourth note pays `EXPEDITION_BONUS`
  (5 Ultra Balls) for all three. They count `save.ranger.week` (`logWeekCatch()` / `logWeekTick()` / `logWeekDay()`, fed
  by the same `rangerCatch()` / `rangerTick()` / `rangerDay()`), which starts afresh with a new week's first event. Their
  ids carry the week (`exp:<week>:<id>`); the Ranger Ranks don't count them. `tasksOn(tab)` / `taskById(id)` reach both
  kinds. The tab shows a banner with the time to the next Monday (`untilWeek()`) and each note's tier.
- **Told as it happens** (2026-10-16): a catch that finishes a task says so in the fight's reward box (`finishedBy()`
  in `js/data/ranger.js`, from `rangerInfo()` in `js/run.js`'s `afterFight()`, before the catch is logged in
  `collect()`). **Ranks on the Trainer Card**: a RANGER line (`rankOf()`), and a badge for each rank past Rookie
  (`ranger-2` to `ranger-7` in `js/data/badges.js`, their `LOOK` lines in `js/trainercard.js`), granted by
  `checkBadges()` as a claim is paid and named in the claim's toast.
- **The Clearing's Safari gate** wears a "!" (`safariMark` in `js/hub-3d.js`, rebuilt with the places) while
  `readyTasks()` has any, and its line says so.
- A new task is a line in `build()`; a new reward kind needs a `rewardText()` line and a branch in `claim()`.

- **The Clearing's stutters** (2026-10-16, the user's report: "choppy sometimes in the beginning and just randomly"), found by
  timing every line of `frame()` and logging texture uploads and new shader programs per frame, headless:
  1. The Pokéstops' glowing words (`stopCue()`) repainted their 760 x 240 picture 30 times a second for the marching
     chevrons, ~180k pixels to the GPU every frame. The words are painted once now (again when Bungee loads) and the
     chevrons are two little quads a face (`chevronArt`), moved by their corners and drawn under the letters, as painted.
  2. Each legendary flying over (`launchFlyer()`, every 30-50 s) compiled a shader mid-frame: its board's material and its
     shadow's were disposed after each flight, so their programs went with them. The last board material is kept
     (`flownMat`, its sprite freed), the shadow is one mesh for every flight (`flyShade`), and both are bent (`bendAll(root)`)
     and compiled with `warmShaders()` before the flight shows: one compile in a session, off the main thread where the GPU can.
  3. The Ancient Tree's door pictures (`ancientArt()`) drop from 8 to 4 pixels a unit: four pictures were 5.2 MP sent to the
     GPU on the first frame, for a door the screen shows ~1/50th of that. The gate (`clearingGateArt()`) and the vista stay
     as they were: smaller, their edges and far ranges moved a few pixels (checked by rendered pixels; the tree's did not).
  Tiny pieces cast no shadow (`smallNoShadow(scene)` at the end of `build()`). The Clearing draws ~590 calls a frame (370 the
  shadow pass, which follows the camera's 26 x 26 area). The Secret Base measured fine: 117 draws fresh, 250 with 22 pieces,
  no shaders compiled while in it, ~20k px of uploads a frame (TV screens); the backyard 61. Merging furniture there would
  need re-merging on every move, recolour or play, so it was left.

### The Trainer's Journal (2026-10-16)

The Ranger Task Board's engine for the whole game (the user's go-ahead), at the Clearing's PC: a TRAINER'S JOURNAL row
in `PAGES.home()` of `js/pc.js` (its count and "!" from `journalReady()`; `pcBeckons()` in `js/pc-news.js` lights the
PC's "!" in the Clearing too). The tasks are `JOURNAL_TASKS` in `js/data/journal.js` (pure, `tests/journal.test.mjs`), 98
in four tabs (`JOURNAL_TABS`): **Runs** (wins, wins by type, Trainer Levels, Level 5 wins, foes, Alphas, bosses, best
streak, Hall of Fame), **World** (each Gym Leader beaten, all of them, Waystones mended, Pokédex pages and Pokémon beaten,
dojo stars, Kenmatta beaten), **Sky Pillar** (best floor, guardians, summits, weeks) and **Collection** (starters owned,
shinies, badges, coins earned, Safari catches, reaching Ranger). Every count reads what the save already keeps, so an old
save has its progress on day one; only `save.journal.claimed` is new. Claims pay PokéCoins only, and climb the
**Journal Ranks** (`JOURNAL_RANKS` in `js/data/journal-ranks.js`, kept apart with no imports so `js/data/badges.js` can
grant a badge per rank, `journal-2` to `journal-7`, without an import cycle; Beginner to Grand Champion). The Trainer
Card's JOURNAL line shows the rank. The board is `openJournal()` in `js/ranger.js`: `BOARDS.journal` (its tabs, tasks,
ranks and save field), the same notes in a stitched leather frame under a red plaque (`.ranger-board.journal` in
`css/hub.css`), a note's photo a big emoji (`pic.emoji`) or a Gym Leader's sprite (`pic.src`), claimed notes stamped
LOGGED ✓. A new task is a line in `build()` there.
- **Rebalanced, with the Trainer set** (2026-10-16, the user: 84,000 PokéCoins in all was "excessive"): the Journal's
  coins are a third of what was first set (`pay()`, about 26,500 in all), the Ranger board's half (about 11,700, its
  Expeditions 100 / 175 / 300 a week), since both together paid several times what coins can buy and an old save's
  day-one claims would have emptied the shop. Six milestones give a **Trainer set** piece instead (`JOURNAL_FURNITURE`,
  `js/data/furniture.js`'s `journal` source, painted in `js/base-furniture-trainer.js`): the trophy case (the first
  win), the Gym Leader case (the first Gym Leader; a new `gym-first` task), the Sky Pillar model (floor 10), the Hall of
  Fame plaque (the first entry), the gold Pokédex stand (every page) and the dojo banner (every star). The first four
  fill in by themselves: a family's `live()` goes into its picture's cache key in `makePiece()` (js/base-furniture.js),
  so the Secret Base repaints it as what it shows changes (`trophies()` in `js/data/journal.js` lists the case's twelve;
  the Gym Leader case shows `LEADER_PICS` from js/base-furniture-gym.js, a silhouette till beaten, gold once all are).
  Players also still place each Gym Leader's signed poster, from the third win against them. **Grand Champion** opens
  the gold Pokédex shell in Settings (`goldShell()` in `js/data/journal-ranks.js`, the chip hidden till then; the rank
  bar names the perk).
- **The cases update while you're away** (2026-10-16, the user: "cool if players see their display update in real
  time"): a live family also has `news(was, now)`. Each time a Secret Base room is shown (`showRoom()`, and the first
  open), `liveNews()` in js/base-3d.js compares each placed live piece's `live()` with `base.liveSeen[kind]` (what it
  showed last visit, saved in the base). A changed one sparkles (gold glints, `sparkle()` / `tickSparks()`, skipped
  under `calmFx()`), the achievement chime plays, and `.b3-news` names what's new for 7 seconds ("BRITT joined your Gym
  Leader case!"). A piece placed for the first time only records what it shows.

### The Grand Catalogue (2026-10-16)

The user's ask after the price rise ("add something big to save up for ... add more things to save up for"), then the
same day their idea of a floor of its own: the catalogue is sold in the Furniture store's **Grand Ballroom (3F)**.
It was a row on the Clearing's PC for an hour; the row and its `NEWS` line are gone. `openGrandShop()` in
`js/grand-shop.js` (the town shop's window with Kurt's Workshop's tabs, `.grand-shop` in `css/screens.css`) is opened by
the Ballroom's keeper, Gardevoir (`KEEPERS[3].special` in `js/mall-furniture.js`). Always in stock. Prices, the shell list
and the Ballroom's door are `js/data/catalogue.js` (`tests/catalogue.test.mjs`). A third Secret Base floor wasn't added:
floors already have no limit.
- **The Grand Ballroom**: `buildFloor(THREE, 3, …)`, the same room as 1F / 2F in midnight blue and gold (`LOOK[3]`, the
  crest GRAND BALLROOM, the wings' signs STARTERS / LEGENDS), its eight stands the gold statues (`statueStands()`: each
  wing's four, a starter you own whose statue you don't first, then ones you have (sold out; another copy is
  Gardevoir's catalogue), then locked ones, which say so), its plaques `HALLS`, the piano in the corner. No door: its
  way out is the lift. **The door**: own `BALLROOM_KINDS` (40) kinds of furniture (`kindsOwned()` in js/secret-base.js,
  bought or earned, statues not counted), then pay `BALLROOM_PRICE` (5,000), both (the user left it to me; a collector's
  floor); saved as `secretBase.ballroom` (`buyBallroom()`); `?mall=3f` lends it open and goes straight in. **The lift**
  asks which floor once 2F is open (`choose()` in js/mall-3d.js: a key a floor in the ask window, `.mall-ask-keys.many`),
  3F shown with a lock till it's bought (`ballroomTap()` says how many kinds to go, or asks to pay); `rideTo` is the floor
  picked; the dial reads 1, 2, 3 (`dialTurn()`: 1F left, 2F up, 3F right). Its statues' sprites load before 3F is built
  (`goPlace()`, only the eight on the stands) and are fetched ahead on 1F / 2F once it's open. Headless under software GL
  the GIFs decode very slowly while the mall draws (a minute); on a plain page eight load in ~1 s, and 3F builds in ~2 s
  (each statue's carved model ~250 ms).
- **Statues**: a gold statue of every starter (`js/base-furniture-statues.js`, `STATUE_KINDS`, group Statues, 2 x 2,
  `solo`): its final form's front sprite (a legendary as itself) gilded by luminance into seven golds, on a marble
  pedestal with its name on a gold plate; 3D comes from its painting (`autoModel()`: the pedestal turned on a lathe, the
  Pokémon a round hull), about three tiles tall. 2,000 the free three, 3,000 skins, 5,000 legendaries, 10,000 Mewtwo
  (listed only once Mewtwo is unlocked; another starter you don't own shows dark, LOCKED). Owned ones can be bought again
  at full price; the PC's Duplicate leaves them out (`duplicate()` refuses a `luxury` piece). `luxury` keeps a family's
  own `price` off `shopPrice()`'s curve (`makePiece()`) and out of the store's daily deal (`dealDay()`).
  **The sprites load on demand**, not at boot (30 GIFs, 2 MB): `loadStatues(ids)` fetches and gilds them; the catalogue
  shows "Unpacking" till they're in, `openBase3d()` awaits the owned ones before building a room (a model built without
  them would be carved bare and cached), and the PC's Decorations repaints once they arrive. A statue's `live()` changes
  once its sprite is in, so its 2D pictures repaint; `icon()` in `js/secret-base.js` now keys its cache on `live()` too.
- **Shells**: six Pokédex shells (Silver, Crystal, Teal, Orange, Purple, White) at 2,500 each, saved in `save.shells`;
  buying one wears it at once (`wearShell()` in `js/settings.js`). Their colours are `data-shell` blocks in
  `css/base.css`; Settings > Device colour shows a bought one's chip (like Grand Champion's gold), seven chips a row.

### The furniture model pass, seasonal sets and yard sets (2026-10-16)

The user's ask: every piece a "3D detailed CLEAN" model, optimised for phones, and a catalogue as big as Animal
Crossing's (the plan: `docs/furniture-expansion.md`; they picked the seasonal and yard sets first, no ceiling layer yet).
- **Every kind is hand-built now**, the starter room's Present too since 2026-10-17 (`present` in `js/base-models-u.js`;
  js/base-3d.js wobbles and opens it as before). New batches, one file each,
  wired last in `js/base-shapes.js` / `js/base-mesh.js` so their SHAPES override older lines: `-l` the Dojo, Safari and
  Trainer sets and the 14 posters (the live Trainer pieces read `K.p.live()` when built), `-m` the old lathed and
  puffed pieces (globes, statues, planets, gumball), `-n` / `-o` / `-p` / `-q` the 64 old `frontbox`es (home machines;
  shop, office and Spooky shelving; school, toy, library, space and farm; arcade and station), the frontbox's old `top`
  (a cut fraction the room misread as a height) replaced by real heights or none.
- **A shape can carry its tap** (`play: { does: ... }`, read by `dressPlay()` after `PLAY`) **and its screen**
  (`screen: { x, y, w, h, z }`, for a cabinet whose only glow colour is its marquee).
- **Lighter**: shared helpers pick their sides by size (`L.sides`; `exact` keeps a count for builders that move
  vertices), `rbox` bevels less when small, `assemble()` merges parts differing only in colour (vertex colours, glows
  through a small emissive-tint patch), dolls and leaf clumps are lighter, a wall piece's crops share its painting's
  texture. The catalogue went from 6.6M to 3.6M triangles over 1,313 models (2,769 a piece, none over 20k), and the
  room bakes a still piece's plain colours (`bakeColours()` in `makePiece()`, not for doors or moving parts) and drops
  small parts' shadows (`smallNoShadow()`): a 40-piece room drew 522 calls a frame, now 325.
- **Seasonal sets** (`js/base-furniture-season1.js` to `3`, models `-r` / `-s` / `-u`, all `solo`): New Year,
  Valentine's, Egg Day, Wedding, Summer festival, Lantern Festival, Harvest and Winter holidays carry `holiday` and are
  dealt only in their window (`js/data/holidays.js`, `tests/holidays.test.mjs`), one stand a floor while one is on
  (`dealDay()`); the Birthday party set (`group: 'Party'`) has no holiday and is sold all year. `?holiday=<id>` holds
  one on for a page load.
- **Yard sets** (`js/base-furniture-yard2.js` to `5`, models `-v` / `-x` / `-z` / `-y2`, themed, `outdoor`): Fences,
  Playground, Sports, Buildings, Water, Camping, Statues, Lights, each kind's `yard` naming its tab in the garden
  catalogue (`GARDEN_TABS` in `js/garden-shop.js`; the first shelf is Yard). The tyre swing swings a Pokémon, and
  Water types swim in the Lotad pond, Psyduck pond and cedar hot tub (`YARD_SEATS` / `YARD_SPOTS`).
- **Statues stand as their sprites** (the same day, the user's ask: "like how you made the gym leader statues"; the
  sculpted yard statues and the Bulbasaur topiary read oddly, the gold ones were 20k-triangle hulls): `js/base-figures.js`
  recolours a Pokémon's first frame down a ramp (stone, hedge greens) for the yard's 11 (`FIGURES`, their plinths too,
  shared by the paintings in `js/base-furniture-yard5.js` and `figureY2` in `js/base-models-y2.js`), and the gold
  statues' gilded sprites stand on a hand-built marble pedestal (`js/base-models-gold.js`). A builder sets `K.figure`
  and `figure()` in `js/base-mesh.js` stands it as a cut-out; js/base-3d.js leans every standee back and turns it
  against its piece's turn, so it faces the camera however the plinth is turned. Fetched lazily like the gold statues'
  (`loadFigures()`, awaited by `openBase3d()`; until then the plinth is bare and `live()` repaints it). ~450 triangles
  each. Articuno's and Zapdos's front GIFs were added for them (PokeAPI black-white animated).
- **The Pokémon rooms** (2026-10-17, furniture expansion session a): Pikachu, Eevee, Snorlax, Jigglypuff, Gengar and
  Lapras, 25 kinds each, every piece shaped after its Pokémon. One painting file and one model batch a set
  (`js/base-furniture-<name>.js`, `js/base-models-<name>.js`, wired last), all `solo`, `group: '<Name> room'`, id
  prefixes `pika` / `eevee` / `lax` / `puff` / `geng` / `lapr`. Sold in the daily stock like any kind. Snorlax and Lapras
  draw painting and model from one part list (`BUILT`, builders `laxparts` / `laprparts`); the others share their
  shapes' numbers between the two files. Taps use only existing `PLAY` entries.
- **Session b's sets** (2026-10-17): the Poké Ball collection (27, `group: 'Poké Balls'`, prefix `pb`: one shared
  `paintBall()` / `buildBall()` over `BALLS`, each type's markings a data line), Museum (`mus`), Contest Hall (`con`),
  Pokémon League (`lg`) and Rocket hideout (`rkt`), 25 each, files `js/base-furniture-<balls|museum|contest|league|rocket>.js`
  and `js/base-models-<same>.js`, wired last. All solo, all Snorlax's way (one `BUILT` part list a kind, builders
  `pbparts` / `musparts` / `conparts` / `lgparts` / `rktparts`, plus a rug builder each). The museum's dig site is a rug
  with bumps up to 0.18 tiles. `tools/model-sheet.mjs` can't draw a shapeless rug (`royalcarpet`, `concarpet`,
  `lgredcarpet`: the room lays them as a flat slab).
- **Session c's sets** (2026-10-17): Day Care (`dc`, 25) and Partner care (`pc`, 25), Snorlax's way (`BUILT`, builders
  `dcparts` / `pcparts` plus a rug builder each; both added a `ring` part and a per-part `seg`). **Figurines** (`fig`,
  30, `group: 'Figurines'`, shown under the tray's Dolls tab): each starter's first form and each legendary but Mewtwo,
  its sprite in full colour (`pvc` in `js/base-figures.js`, kept in `FIGURINES`, apart from the yard's `FIGURES` that
  `base-models-y2.js` keys on) on a glossy base, small enough to stand on a table, tapped to turn. Loaded where shown:
  `figuresToLoad()` by the mall (each floor's stock before its hall is built), the PC's Decorations and the base; the
  garden catalogue loads only its own statues. **60 more dolls** (30 Pokémon, small and big): patterns in
  `js/base-dolls-2.js` (Gen 2-3) and `-3.js` (Gen 4-5), appended to `DOLLS` / `PLUSH` / `EXTRAS`, their new extras drawn
  only through `SEW` (js/base-dolls.js's pen-aware kit: puff, shape, line, curveLine, dot, flat, flame). The model check
  now matches a standee by its cut-out (alpha), not its whole rectangle.
- **Session d's series** (2026-10-17): Antique (`antq`), Rattan (`rtn`), Log cabin (`cabin`), Ironwood (`iw`) and
  Imperial (`imp`), 25 each, `group` the series' name, files `js/base-furniture-<antique|rattan|logcabin|ironwood|imperial>.js`
  and `js/base-models-<same>.js`, wired last; all solo, Snorlax's way (builders `<prefix>parts`, rugs `<prefix>rug`). New
  part kinds there: Rattan's `weave` finish, Log cabin's side discs (cut log ends) and its plaid as one cached canvas each,
  Antique's `slab` (a side profile run across) and `horn`. Pokémon touches: a Stantler antler mount, a Pidgey cuckoo
  clock, Ursaring and Teddiursa carvings, a Gyarados carving and scroll, a Lapras in the gilt landscape.
- **Session e's series** (2026-10-17): Diner (`dnr`), Cute (`cute`), Elegant (`elg`), Golden (`gold`) and Shell and
  mermaid (`mer`, `group` 'Mermaid'), files `js/base-furniture-<diner|cute|elegant|golden|shell>.js` and
  `js/base-models-<same>.js`, built as session d's (builders `<prefix>parts` / `<prefix>rug`; Golden's `gldparts`, with a
  `plate` part, an outline seen from above, for the grand piano). **The Golden set is earned, never sold**: source
  `golden` in `js/data/furniture.js` (`GOLDEN`), the nth piece owned at n achievements earned, whichever ones
  ("Earn N achievements (k/N)"), the throne at all 22; `goldbed`, `goldchest`, `goldvase` from the `gold`, `roster` and
  `shiny-hunter` badges. Being in `FURNITURE` keeps it out of every shop's stock.
- **Session f's series** (2026-10-17): Cherry blossom (`blsm`), Maple leaf (`mpl`), Acorn (`acrn`) and Mushroom (`shrm`),
  files `js/base-furniture-<sakura|maple|acorn|mushroom>.js` and `js/base-models-<same>.js`, built as session d's. **Cherry
  blossom and Maple leaf are seasonal**: `holiday: 'sakura'` (April) and `'maple'` (October) in `js/data/holidays.js`,
  dealt on the holiday stand like the holiday sets, a month each so the 25 can be collected. New parts: Cherry blossom's
  `flower` and `petal` (`flowerPts()`, shared by both files), Maple leaf's one leaf outline (`leafPts`, a `lie` leaf lies
  flat), Acorn's lathes lying over (`rot`) and painted-only cap cross-hatch (`tex`), Mushroom's squashed lathe (`sz`),
  half cylinder against the wall (`half`), side-facing disc (`ax: 'x'`) and gill cone (`gl`).
- **Session g's series** (2026-10-17): Wooden block (`blk`), Throwback (`thb`), Ranch (`rnch`) and Iron garden (`igd`),
  files `js/base-furniture-<block|throwback|ranch|irongarden>.js` and `js/base-models-<same>.js`, built as session f's
  (`BUILT`). **Iron garden is outdoor**: every kind `outdoor: true`, `yard: 'Iron garden'`, so it stands only in the yard
  and has its own tab at the end of `GARDEN_TABS` (`js/garden-shop.js`); no wall pieces (the yard has none), its rug a
  mosaic paving. Its thin wrought iron matches the paintings at only 0.41 to 0.65 (the painting's outline doubles a rod).
- **Session h's series** (2026-10-17): Bamboo (`bmb`), Stone zen (`stz`), Constellations (`cst`) and Desert caravan
  (`crv`), files `js/base-furniture-<bamboo|stonezen|constellations|caravan>.js` and `js/base-models-<same>.js`, built as
  session g's (`BUILT`). **Stone zen is outdoor** like Iron garden: `outdoor: true`, `yard: 'Zen'`, its own tab last in
  `GARDEN_TABS`; no wall pieces, its raked gravel and stepping stones are ground (rug) pieces. New parts: Bamboo's
  `cane()` (a rod with node rings) and cord `lash()`, Stone zen's `rock` (a sphere pushed out to the painted outline,
  `rockOutline()`) and square `sq` lathe, Constellations' extruded stars and crescents (`starPts()`, `crescent()`) and
  rings standing side-on or tilted, Desert caravan's flattened cylinder (`sz`) for drapes against the wall.
- **Session i's room types** (2026-10-17): Hospital (`hsp`), Bistro (`bst`), Bakery (`bak`), Sushi bar (`ssh`) and
  Ramen shop (`rmn`), files `js/base-furniture-<hospital|bistro|bakery|sushi|ramen>.js` and `js/base-models-<same>.js`,
  built as session h's (`BUILT`). A room type furnishes one place (its working pieces, seats, storage, wall pieces and
  props), not a bedroom. New parts: side-on rings and discs (`ax: 'x'`, wheels and castors), the Bakery's `wedge` (a side
  profile extruded across, the awning). Taps reuse `PLAY`: the hospital bed `heal`, the ovens' and fridges' `door` with a
  modelled inside (`bare`), the ticket machines `give` paper.
- **Session j's room types** (2026-10-17): Pizzeria (`pzr`), Corner shop (`crs`, a Poké Mart), Laundromat (`lnd`), Salon
  (`sln`, with Furfrou's trims) and Garage (`grg`), files `js/base-furniture-<pizzeria|cornershop|laundromat|salon|garage>.js`
  and `js/base-models-<same>.js`, built as session i's. A drum turning front to back can't be a tap (`spin` turns the
  whole piece upright), so the dryers whirr; a spinning part turns about the model's centre, so the barber pole stands
  on the floor rather than hanging on the wall.
- **Session k's room types** (2026-10-17): Craft and sewing room (`crf`), Gamer room (`gmr`), Recording studio (`rcs`) and
  Cinema (`cnm`), files `js/base-furniture-<craft|gamer|studio|cinema>.js` and `js/base-models-<same>.js`, built as session
  j's. Live screens (the gamer desk's middle monitor, its TV, the cinema's silver screen) set their own `screen` rect.
- **Checking a model** (text, no screenshots): `node tools/model-check.mjs id,id` prints its builder, size, triangles,
  draws and how its front silhouette matches its painting; `tools/model-sheet.mjs` renders a labelled sheet when the
  user asks for pictures. Budgets: 4k triangles a 1x1 piece, 7k bigger, 8 draws.
- **The turntable's context** (2026-10-17): `js/turntable.js`'s one renderer sleeps 4 s after its last draw
  (`sleepGL()`), woken by `wakeBeside()` (`js/hd2d.js`, which leaves the place on screen awake); `drawTurn()` returns
  false and draws nothing while it wakes, so a still taken then is tried again (`snapAll()` in `js/garden-shop.js`).
  `piecePreview()` keeps the last 8 pieces' previews, disposing older ones.
- **The Clearing's dressing** (2026-10-17): the lamps, benches, flower beds, pond stones and lily pads are built into one
  group and merged (`dressClearing()` in `js/hub-3d.js`), the garden arch's brambles and gate leaves too
  (`js/hub-arch.js`): 575 draws a frame to 397.

## The arcade overhaul (2026-10-17, the user's ask: "make them super detailed... the pinball is pretty bland"; Bubble Shooter "got repetitive and easy")

Every Game Corner arcade game (the 18 on its floor) was rebuilt in one session, each still one `js/arcade-*.js` file on
the kit, its world painted once a scale (`stamp()` or a cached canvas) so phones keep 60 fps, and a difficulty ramp with
no plateau. Each file's header says what it now has; the gist:
- **Leaving keeps the score** (the user's ask, 2026-10-17, "like a force quit but saving our score"): EXIT, Escape or
  RESTART mid-game banks the score so far as the Best and posts it to the weekly leaderboard, as a game over would
  (`bank()` in `js/arcade-kit.js`, every cabinet).
- **Pokémon Pinball**: a real table (300x520): plunger lane with a swinging power gauge and a Skill Shot, P K M rollover
  lanes (flippers turn them, all three raise the bonus multiplier to 5x), Voltorb bumpers, slingshots, a spinner, two
  orbits, the Pika Ramp, Diglett drop targets that light CATCH, the saucer starting Catch mode (a wild Pokemon, hits on a
  timer, rarer ones as the list grows), Multiball on three ramps with Jackpots, Pikachu kickbacks, a ball saver, extra
  balls at 3 and 8 catches, a dot-matrix strip on top. LAUNCH is a pad key.
- **Squirtle Bubble Shooter**: a shot clock that fires for you (`clockFor()`, 10.5 s down to 4 s by level 16), Geodude
  rocks from level 5 (`ROCK`, `rocksFor()` in `js/data/bubble-boards.js`, below the top row, picked by the level), laps
  two shots quicker (`LAP_FASTER` 2); chains x2 to x5 and a Voltorb bomb every 4th popping shot in a row.
- **Ponyta Dash** four lands and hazard tiers every 250 m, Berries, Protect, a Fire Stone Rapidash; **Pidgey Flap** four
  skies, sliding trunks, guards, charging Spearow, evolves at 30 / 60; **Snorlax Stacker** cushions from the meadow to
  space, Perfect streaks regrow the cushion; **Voltorb Memory** growing boards with a preview, Voltorb cards, Ditto swaps.
- **Berry Catch** stages with quotas, power-up Berries, wind, weaving Pineco, Forretress; **Where's Ditto?** a theatre,
  feints, up to five balls, a pick clock, lights out, a Golden Ditto; **Geodude Bowling** lane oil, Golden Geodude and
  Turkey bonuses, Diglett in the lane; **Poké Puzzle** levels every 30 s, Trubbish garbage slabs, stop time, Shiny panels.
- **Electrode Breakout** ten walls, Golem / Voltorb / steel / crystal bricks, Laser (a FIRE key) and Catch, Onix every
  fifth; **Poliwag Crossing** diving Lapras, a bank Ekans, Arbok in a pad, Butterfree; **Ekans Trail** eight walled stages,
  Chesto, Rare Candy, Diglett; **Gastly Maze** four mazes, four ghosts with Pac-Man's personalities, chained zaps.
- **Psyduck Pong** a pool and a ladder of six rivals, first to 5 each, smashes and power-ups; **Whac-a-Diglett** 20 s
  stages with quotas, Dugtrio, golden Diglett, Voltorb / Electrode, Fever, a miss stalls the mallet; **Pikachu
  Volleyball** a beach, six rivals, Thunder spike, sea wind, four touches a fault; **Beedrill Invaders** formations,
  Kakuna, dive-bombers, berry-bush bunkers, power-ups, Vespiquen every fifth wave.
- Not touched: the home-only Claw Machine, Skee-Ball, Sing-Along and Word Search.
- **Checking a game** (text, no screenshots): `NODE_PATH=$(npm root -g) node tools/arcade-check.mjs arcade-pinball
  openPinball 20 [left,right,plunge]` plays it headless and prints fps, drawImage calls a frame, the lines it said and
  any errors.

## Four more pinball tables (2026-10-17, the user's ask: "4 more of those pinball games, each completely different, same aesthetics")

Each its own Game Corner prize (750 coins, `PRIZES` in `js/data/corner.js`) and home game (`js/home-arcade.js`), on the
right wall in a row with Pokémon Pinball, where that wall's five slot machines stood (the user's ask, the same day;
the slots keep the left wall; `ARCADE` / `CASINO.slots` in `js/mall-corner.js`), their 3D table
`B.pinball` with `table:` (`PIN_LOOK` in `js/base-mesh.js`, pictures `PIN` / `tableField()` / `tableGlass()` in
`js/arcade-art.js`), paintings `pinTable()` in `js/base-furniture-rooms5.js`, marquees in `MARQUEE`.
- **The engine** is `js/pinball-kit.js` (Pokémon Pinball keeps its own): a table is a definition (walls, flippers, slings,
  lane, art, `make(t)` returning its hooks); the kit runs flippers (any number, ◀ works every left one), the plunger,
  saver, multiball, `t.ride()` ramps, `t.hold()` saucers, the dot-matrix strip, the bonus count, a scrolling camera
  (`worldH`, `camera(low, cam)`) and a ball search that never nudges a ball cradled on a held flipper.
- **Gengar's Haunted Pinball** (`js/pinball-gengar.js`, `gengarpinball`): a night graveyard, Gastly as drifting bumpers,
  G-H-O-S-T tombstones light HAUNT at the mansion door (Gengar teleports; bust him for a 2-ball Party), an unlit door
  topples the next stone, every third orbit LIGHTS OUT (dark but for the ball, ×2), a small upper flipper, Duskull kickback.
- **Lapras's Lagoon Pinball** (`js/pinball-lapras.js`, `lapraspinball`): floatier (grav 540, drag), a whirlpool that spins
  and flings the ball, Staryu bumpers, a Magikarp captive ball (6 splashes: Gyarados's Rampage, ×5), Shellder pearls
  (4: an extra ball), SURF on three left orbits (2 balls, the wave lifts draining balls), a Lapras post during the saver.
- **Charizard's Volcano Pinball** (`js/pinball-charizard.js`, `volcanopinball`): fast (grav 680), three flippers, crossing
  FLAME / BLAZE ramps, a HEAT bar lighting the crater for a 3-ball ERUPTION, F-I-R-E twice an evolution (Charizard lights
  BLAST BURN), combos within 3 s.
- **Rayquaza's Sky Pillar Pinball** (`js/pinball-rayquaza.js`, `skypinball`): 980 tall, two screens like the Game Boy's
  (the sky above y 505, the tower below 560), four flippers, the Sky Lift lights ASCEND to climb five floors (new bumper
  Pokémon each), Rayquaza on floor 5 (8 hits: Dragon Ascent, 3 balls), wind gusts, Trapinch → Flygon kickbacks.
- **Checking a table**: `NODE_PATH=$(npm root -g) node tools/pinball-sim.mjs pinball-gengar 8 10` plays whole games with a
  bot (scores, ball lives, each table's `t.stat` counters, nudges, escapes); `tools/arcade-check.mjs` for the cabinet.
  The bot is weak; only compare runs of the same bot.

## The Arcade Room (2026-10-17, the user's "build it" after a mock-up)
The Game Corner's arcade machines have a room of their own, `js/mall-arcade.js` (`buildArcade()`, `SHOPS.arc` in
`js/mall-3d.js`), so a phone never holds both rooms' pictures (headless at an iPhone's size: the Game Corner was 83 MB of
textures, now 55; the Arcade 54). The way in is a doorway in the Game Corner's right wall at rows 6-7 (`ARCADE_DOOR`,
`arcadeDoorArt()` in `js/mall-corner.js`), at the end of the aisle between the quiz and High-Low tables, a spot of kind
`door` (`into`, `through`: `throughDoor()` in `js/mall-3d.js` steps into it, then `goPlace()`s the room). The Arcade's
doormat goes back through it (`out: 'gc'` in `SHOPS`, `back()`), arriving at the doorway. `?mall=arcade` walks straight in.
- **Layout** (15 x 10, `MACHINES`): six cabinets each side of Porygon's FREE PLAY desk on the back wall (the desk tiles
  6-8), the weekly arcade leaderboard on the wall over it (moved from over Meowth's counter; the GAME CORNER sign is back
  down in its place), Whac-a-Diglett and Berry Catch, Where's Ditto?, Bubble Shooter and Poké Puzzle down the left wall,
  the five pinball tables down the right. The middle stays open, room for a free-standing row when new games come.
- **Shared with the Game Corner**: its wallpaper, tubes, side walls and gold frame (`paper()`, `tube()`, `sideArt()`,
  `frameArt()`) and `machineMaker()`, which stands a Secret Base model as a game. The carpet is its own (`carpetArt()`:
  neon shapes on navy). One side-wall picture serves both walls in each room (two uploads of it were ~4-5 MB).
- **Porygon** (`ARCADE_KEEPER`) only chats; the leaderboard is the board's tap. The Game Corner's regulars stay next door.

## The mall's floors on the GPU (2026-10-17)
Every floor the mall builds stays in its one scene, hidden when you're elsewhere, but its textures stayed uploaded: the
hall under the Game Corner was ~126 MB of textures, and a friend's phone reloaded the game walking in. `setPlace()` in
`js/mall-3d.js` now `unload()`s the floor walked out of (`js/hd2d.js`: geometry and textures let go on the GPU, kept
whole in memory, uploaded again by `warm()` under the curtain on walking back in). Keep it if a floor is added.

## A friend's base, visited (2026-10-17)

`openBase3d({ guest })` opens a friend's base from their trainer page, walk-only, every base write refused while it's
up (`visitBase()` / `keep()` in `js/secret-base.js`). The detail is in `docs/reference/cloud-save.md`'s Trainers section.
A new base write in `js/secret-base.js` goes through `keep()`, and a new thing that happens on entering the base (a
visitor, an intro, a gift) checks `host` in `js/base-3d.js`.
