## Cloud save

Optional, from the Pokédex's Settings app (the user's picks, 2026-09-28: Firebase, Google and email-link sign-in, ask when two
saves differ). Since 2026-09-30 also email + password (Sign in / Sign up / Forgot password, `withPassword()`): iCloud
Mail drops Firebase's default-sender emails, so the link never reached iCloud users; a password sends no email. `js/cloud.js`; the project (`pokedb-42e7c`, the user's) and its public web config is `FIREBASE_CONFIG` in `js/cloud-config.js` (not a secret;
the Firestore rules guard the data). While it's `null` the ☁️ Sign in item (`#cloud-btn`) and the title's PC stay
hidden and nothing changes. The title's top-left corner has its own way in once the gems are up: the games' PC
(`#title-account`, hidden in hub mode since 2026-10-09, where the Clearing's PC has a Sign in row instead, `js/pc.js`; the 🖥️ pixel icon big, captioned Sign in / Cloud save, a green power light once signed in; the user's
idea; tapping it plays `pc-on`, `assets/audio/sfx/pc-on.mp3`, the games' PC boot sound, supplied by the user, and
sets `data-close-sound="pc-off"` on the window, so however it closes it plays `pc-off.mp3` (logging off) in place of
`cancel`: `js/ui.js`'s outside tap and `js/audio.js`'s Escape skip `cancel` for a window with a `data-close-sound`; both
are preloaded so they replace the menu blip; from the Pokédex's Settings it closes as usual). Signed out, the Firebase SDK (gstatic, 12.19.0, `firebase-firestore-lite`) is never downloaded: it loads only
when `pokedb.cloud.v1` (this device's `{ uid, rev, dirty, localAt }`) says you're signed in, the URL is an email sign-in
link, or you open the window. Both localStorage keys (`SAVE_KEYS` in `js/storage.js`) go as they are into one Firestore
document, `saves/<uid>` = `{ save, run, rev, savedAt, device }`; `onSaveWrite()` fires on every write, and the upload
follows 4 s later (and when the tab hides, or comes back online), in a transaction that refuses it if the cloud's `rev`
isn't the one this device last agreed with. Rules: cloud moved and this device didn't → take the cloud's (write the keys,
`location.reload()`; only on the title or right after signing in, else ask); this device moved → upload; both → the
"Two saves found" window (`#cloud-pick-dialog`, a summary of each; closing it means ask again next load). The first
sign-in on a device uploads its save if the cloud has none (the user's phone save becomes the first cloud save) and takes
the cloud's if this device has no progress (`isBlank()`). Sign out keeps the local save. Settings' Reset save uploads the
erased save too (the reload finds it dirty), so every signed-in device takes it. Email links come back to the page with `?mode=signIn&oobCode=...`; the address is kept in
`pokedb.cloud.email` (asked again if the link opens in another browser) and the URL is cleaned. Firestore rules, and the
Firebase console steps, are in the roadmap's step 4; since the Safari leaderboard, `firestore.rules` in the repo is the
whole rules file (this rule plus `safariBoard`, docs/reference/safari.md). Live: the rules are published and the
boards readable (checked 2026-10-15: `towerBoard` and `arcadeBoard` hold real entries); a new board needs its rule
added to `firestore.rules` and the file published again. `cloudSession()` / `onCloudSignIn()` /
`openCloud()` are exported for `js/leaderboard.js`. Headless tests route gstatic to stand-in modules (the real SDK
can't be reached from a cloud session).


## Trainers: friend codes and the friends list (2026-10-17, session 1 of the roadmap's "Friends list and base visits")

Signed-in players only. `js/trainers.js` (network and the app) and `js/data/trainers.js` (pure: codes, the list, the
doc, `tests/trainers.test.mjs`). Rules in `firestore.rules`, checked in the Firestore emulator (62 cases).
- **`trainers/<uid>`** = `{ code, name, card, buddy, base, at }`, the public page: `card` the Trainer Card's numbers
  (`cardDoc()`: tier, earned badge ids, wins, Pokédex, Safari, stars, play minutes, the partner as a `save.partner`
  key; since 2026-10-18 also `rank` the Journal rank's index, `top` the highest Trainer Level won, `fave` the starter
  with most wins, `pillar` the best Sky Pillar floor, -1 / '' / 0 when none or on an older page). Rules published
  before those keys refuse them, so `publishTrainer()` writes the page again without them on `permission-denied`
  (`NEW_CARD_KEYS`). Rules with them published 2026-10-18. Later that day `shinies` (the Trainer Card's SHINIES,
  `shinyTotal()`) and `ranger` (the Ranger Rank's index, -1 before the Safari opens) joined; `NEW_CARD_KEYS` now holds
  only those two, and they stay 0 / -1 until the rules are published again. `buddy` a `save.buddy` key, `base` `save.secretBase` as JSON (left out past `BASE_MAX`, 600,000) for session 2's
  visits. Written by `publishTrainer()` on every sign-in (`onCloudSignIn`, which fires on each load while signed in)
  and as you leave your base (`leave()` in `js/base-3d.js`). Rules: signed-in `get` only (no listing), the owner writes
  it under a code `codes/` says is theirs, bounded like the boards. Someone else's page is only drawn through
  `readDoc()` / `cardDoc()`, and sprites only from our own keys (never a URL); a Pokémon you haven't met (Mewtwo before
  it's yours) stays a silhouette and `???`.
- **`codes/<CODE>`** = `{ uid }`: 8 of `CODE_LETTERS` (no O, I, L), shown as ABCD-EFGH. `ensureCode()` reuses the
  code on your page, else claims a new one (create-only, so a clash is `permission-denied` and rolls again). This
  device keeps it in `pokedb.trainer.code` (`{ uid, code }`), **not in the save**: a save write during a first sign-in
  would mark this device's save changed and pop "Two saves found". `myCode()` is null while signed out.
- **`save.friends`** = `[uid, ...]`, at most `FRIENDS_MAX` (50), one way, no requests; the cloud save carries it.
  Added by a typed code (the app's box: any case, spaces or a dash) or a leaderboard page's "+ Add to Trainers"
  (`addKey()` in `js/leaderboard.js`, on anyone else's entry while signed in).
- **The Trainers app** (`trainersApp()`, a `shelfApp()`; on the home screen whenever cloud save is configured): your
  code and the add box on LCDs over the banners, a banner per trainer in their card's colour (their buddy, last seen,
  badges), their page the handheld (the 2026-10-18 tidy-up, the user's pick from a mock): the nameplate's second line
  their Journal rank and last seen (`sub` in `shelfApp()`), partner and card colour, a grid three across (Wins, Dex, Stars, Top
  Lv, Fave as a sprite so a long name never spills, Pillar, then Safari, Shinies, Ranger; the user's call, 2026-10-18:
  two rows show, the third peeks in and the grid scrolls, so more can join without the page growing; a fixed
  `--trn-row` height in `css/menus.css`; Ranger drops its trailing "Ranger", as "Senior" under the label), the newest 7 badges and a +N, buddy;
  every part has a `title`, so a tap explains it (js/tips.js), Visit (greyed until session 2) and Remove (a
  second tap confirms). One `getDoc` a trainer on each open. A trainer with no page yet shows as `???`, "Not on the
  network yet".
- **Introduced by** the Going Further tip in How to play, the PC's TRAINERS row (your code under it; opens the app),
  the Trainer Card's CODE line, and a one-time letter from TRAINER NETWORK (`trainersLetter()` in `js/mail.js`,
  `save.trainersLetter`) the first time a signed-in player logs on to the PC, its code where a prize would be, Read
  not Claim.
- **Finding each other without meeting** (2026-10-17, the user's ask, the same day): the **Trainer Plaza**,
  `plaza/<uid>` = a blurb (`blurbDoc()`: name, buddy, partner, tier, badge count, wins, `at`), written with your page
  unless `save.plazaHidden` (the app's Hide me / Show me deletes or rewrites it); the app's Plaza banner lists the
  `PLAZA_SHOWN` (30) on most lately (`plazaPick()`), never you, each with + Add. **Notes**: adding anyone (code, Plaza,
  leaderboard, Add back) leaves `adds/<to>_<from>` (`addDoc()`, `seen: false`); removing takes it back (`removeTrainer()`).
  Rules: only `to` reads (a query on `to == you`) and only marks `seen`; `from` writes as themselves; either deletes.
  The app's **Added you** banner (gold, a "!") lists who added you and isn't on your list, with Add back.
- **The TRAINER LINK pop-up** (`js/trainer-notice.js`, the user's ask: "aesthetic... like it's from a video game or MMO,
  immersive Pokémon style"; they saw it in a screenshot before it was pushed): on sign-in, after the page is written,
  `checkNotes()` queues every unseen note and shows them once the player is somewhere calm (`calmNow()`: no run screen,
  window, PC or open Pokédex), 2.5 s after load. A card in the adder's Trainer Card colour: a signal and TRAINER LINK
  (1/2...), a Poké Ball that falls, wobbles and opens in a flash on their buddy over painted rays (`rayWheel()`, not a
  CSS gradient), a name plate (tier, name, badges, wins), the games' text box typing out the line with a blinking ▼,
  and A ADD BACK / B LATER (keyboard: Enter, Z / Escape, X). Add back stamps LINKED! and plays `item-get`; someone who
  adds you back after you added them gets TRAINER LINKED with OK only. Answering marks the note seen (it never pops
  again; Later leaves them under Added you). Calm effects skip the ball, flash and bobbing. `?addnotice=N` shows N
  samples with nothing sent.
- **The welcome** (the same day, the user's ask): the first time the Trainers app opens signed in (`save.trainersWelcome`),
  and from the ? key by your code, a TRAINER NETWORK card in the same style (`showTrainerWelcome()`): your buddy out of
  the ball, YOUR TRAINER CODE on the plate, seven lines (the seventh, friends' graves, 2026-10-18) paged with A NEXT (the last LET'S GO!), B SKIP (`WELCOME` in
  `js/trainers.js`); its last line points at Visit (session 2's visits landed the same day).
- **The Trainer Plaza's board in the Clearing** (the same day, the user's ask: "the physical 3D board"):
  `plazaBoard()` in `js/hub-plaza.js`, the place `plaza` on `PLAZA_AT` (since the user's marks on an aerial shot, the
  same evening: 17.5,8.4, the plaza's top right corner between the north avenue and the PC, turned to face the plaza,
  `facePlaza()`, scaled 1.1; the quest board mirrors it at 12.5,8.4), only while cloud save is configured. A real model: posts, a teal gable with a turning
  Poké Ball on its ridge, a TRAINER PLAZA plank, bunting, two lanterns lit after dark (`glowMats`), flower pots. Its
  cork is a canvas of up to 6 Polaroids from `plazaTop()` (once a minute at most; you among them with a gold YOU
  sticker; a masked Pokémon a silhouette), a pinned notice when signed out or empty. Its Look key opens the app straight
  onto the Plaza (`acts.onApp('trainers', 'plaza')`, `mount(panel, 'plaza')`). First tried at 19,14 (Halloween's pumpkin
  patch stood in front of it from the camera's angle), then 11,14 by the mall, before the user's marks.
- The TRAINER LINK pop-up checks for calm every 1.5 s (`whenCalm()`): the Clearing's boot can hold it a while.
- **Visit** (2026-10-17, session 2): the app's Visit key (open once their page carries a `base`; a base with a bought
  backyard gets two, Visit house and Visit yard, `start` `main` / `yard`, since the yard is reached through the garden
  arch, not the house: the user's pick over a back door, 2026-10-17) calls the hook main.js
  hands `onVisit()`, which leaves the title and opens `openBase3d({ onLeave: showHome, guest: { name, json } })` (refused
  mid-run, "Not mid-run"). `readGuestBase()` in `js/secret-base.js` reads their JSON as untrusted: back in the main
  room, only known pieces (no present, no `hax` ids), known papers, no lent yard; null if it isn't a base ("Can't open
  it"). In the room (`host` in `js/base-3d.js`): titled "NAME's Base", a hint saying whose it is, no Decorate or Garden
  key, no Smeargle, yard intro, Gym Leader or friend dropping by, no liveNews, their PC and Berry plots only say so;
  doors, seats, piece taps and home games work. Their residents are their `mons` (Safari ids only, 12 at most), your
  partner walks it, their statues and figures load from their `owned`; the Trainer set's cases show what they held the
  last time their owner was home (`lendTrainerShows()` in `js/base-furniture-trainer.js`, from the base's `liveSeen`,
  each kind's last `live()` string; a case never seen at home shows empty), since the page carries no trophies. **The guard**: `visitBase(true)` while it's up makes
  `keep()`, which every base write in `js/secret-base.js` goes through (saveBase and all 12 buyers), a no-op; leaving
  calls `endGuest()` and doesn't `publishTrainer()`. The next open of your own base takes the `reopen()` path with
  `loadBase()`. A friend's base has no 2D fallback (no WebGL: straight home). `?base&asfriend` opens your own saved base
  as a visitor sees it.
- **Friends' graves** (2026-10-18, the user's ask: "the tombstone thing", the 2026-10-07 phase 2's ghosts where they lost):
  every lost run, Safari and Sky Pillar ones too (not a playtest), is packed small (`fallNow()` in `js/run.js` →
  `recordFall()` in `js/graves.js` → `packFall()` in `js/data/graves.js`: where, what beat it and the loss recap's page,
  JSON of at most `FALL_LEN` 4,000, its deck and chart trimmed to fit), kept as the save's last `FALL_MAX` 5
  (`save.falls`) and written to **`graves/<uid>`** = `{ name, buddy, tier, falls, at }` (`publishGraves()`, also on every
  sign-in). Its own doc, not a key on `trainers/<uid>`: that page carries the whole base (up to 600 KB), and a map reads
  every friend's at once (one small `getDoc` each, cached 5 min, `friendsNow()`; the map draws at once and only the graves
  are drawn again when the fetch lands, `setMapGraves()` / `setTowerGraves()`). Rules: signed-in `get`, never listed, only
  the owner writes, 5 strings of 4,000 at most (`fallOk()`). Before those rules are published every write is refused and
  nothing else changes. **Where a grave stands** (`gravesHere()`): a Safari fall at its very room on that day's map (the
  seed makes it everyone's), a Sky Pillar one by the door it went through on that week's tower (`graveStones()` in
  `js/tower.js`, any floor in view), any other run's on the same floor of the same biome by a room a hash of the grave
  picks (each map differs), a boss fall by the boss; `GRAVES_SHOWN` 8 on a map at most, the newest first. A pixel
  tombstone (`graveSvg()` in `js/map.js`) by the room's foot, a wisp over it till you leave flowers. A secret starter's
  fall (Mewtwo) stays hidden until it's yours. **A tap** opens `#grave-dialog`: the loss recap (`lossPage()` in
  `js/halloffame.js`), **Pay respects** (flowers on the stone, +`RESPECT_COINS` 5 PokéCoins, once a grave) and
  **Avenge** (open while the Pokémon that beat them is still ahead on this map: a vow, `run.avenge`, saved with the run;
  winning a fight against that Pokémon on this map pays +`AVENGE_COINS` 25, once a grave, `avengeGrave()`); both kept in
  `save.graveMarks` `{ r, a }` (the last 200 ids). PokéCoins only, never anything in the run, so a Safari first try stays
  fair. A playtest run shows real graves too but saves nothing. `?graves=N` puts N made-up friends' graves on any map and
  their buddies in the Plaza, nothing fetched or sent.
- **The Trainer Plaza's buddies** (the same day): up to 4 trainers on your list, on most lately first, walk the paved
  plaza as their buddies (`makeBuddies()` in `js/hub-buddies.js`, from `plazaBuddies()`), a name tag over each in their
  card's colour, one strolling at a time; a tap and it hops, cries and talks in the Halloween ghosts' speech window
  (whose it is and when they played, where their last run ended, Visit). Billboards in the Clearing's own scene (no
  renderer of its own), read again at most every 10 minutes and rebuilt only when who's there changed
  (`friendBuddies()` in `js/hub-3d.js`). Memory (tools/memory-probe.mjs, 2026-10-18): the Clearing 123.8 MB -> 125.3 MB
  with 4, a map unchanged at 32 MB, one GL context awake either way.
- Tests: `tools/graves-check.mjs` (two stand-in accounts: B loses a real run, A finds the grave on that floor, opens the
  recap, pays respects, meets B's buddy; `OLD_RULES=1` refuses graves/ and checks nothing breaks), `tests/graves.test.mjs`,
  the graves cases in `tools/trainers-rules.mjs`.
- Tests: `tools/trainers-check.mjs`, two stand-in accounts in Playwright sharing one in-memory Firestore that mirrors
  the rules (gstatic routed to stand-in SDK modules, Three.js from disk as its argument or `THREE_JS`, so the Clearing and
  the base run; codes and pages, adding by code, leaderboard and Plaza, the welcome, the TRAINER LINK pop-up, Added you,
  Hide me, and the visit's: the base on the page, Visit open, the room as theirs, no keys or visitors, unknown pieces
  dropped, every base writer called during the visit and taps on the room, then the whole localStorage the same after
  leaving bar the play clock, B's page not republished, B's own base theirs again and saving, A's trophy case showing
  A's trophies and B's own again at home, Visit yard into their backyard with no Garden key), and
  `tools/trainers-rules.mjs`, the real rules in the
  Firestore emulator (how to run it is at its top). Rerun both when the doc or the rules change.
