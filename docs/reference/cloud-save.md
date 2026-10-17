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
doc, `tests/trainers.test.mjs`). Rules in `firestore.rules`, checked in the Firestore emulator (33 cases).
- **`trainers/<uid>`** = `{ code, name, card, buddy, base, at }`, the public page: `card` the Trainer Card's numbers
  (`cardDoc()`: tier, earned badge ids, wins, Pokédex, Safari, stars, play minutes, the partner as a `save.partner`
  key), `buddy` a `save.buddy` key, `base` `save.secretBase` as JSON (left out past `BASE_MAX`, 600,000) for session 2's
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
  badges), their page the handheld: partner, card facts, badges, buddy, Visit (greyed until session 2) and Remove (a
  second tap confirms). One `getDoc` a trainer on each open. A trainer with no page yet shows as `???`, "Not on the
  network yet".
- **Introduced by** the Going Further tip in How to play, the PC's TRAINERS row (your code under it; opens the app),
  the Trainer Card's CODE line, and a one-time letter from TRAINER NETWORK (`trainersLetter()` in `js/mail.js`,
  `save.trainersLetter`) the first time a signed-in player logs on to the PC, its code where a prize would be, Read
  not Claim.
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
- Tests: `tools/trainers-check.mjs`, two stand-in accounts in Playwright sharing one in-memory Firestore that mirrors
  the rules (gstatic routed to stand-in SDK modules, Three.js from disk via `THREE_JS`; 48 checks, the visit's: the
  base on the page, Visit open, the room as theirs, no keys or visitors, unknown pieces dropped, every base writer called
  during the visit and taps on the room, then the whole localStorage the same after leaving bar the play clock, B's page
  not republished, B's own base theirs again and saving, A's trophy case showing A's trophies and B's own again at
  home, Visit yard into their backyard with no Garden key), and `tools/trainers-rules.mjs`, the real rules in the
  Firestore emulator (how to run it is at its top). Rerun both when the doc or the rules change.
