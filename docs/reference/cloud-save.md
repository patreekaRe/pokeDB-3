## Cloud save

Optional, from the Pokédex's Settings app (the user's picks, 2026-09-28: Firebase, Google and email-link sign-in, ask when two
saves differ). Since 2026-09-30 also email + password (Sign in / Sign up / Forgot password, `withPassword()`): iCloud
Mail drops Firebase's default-sender emails, so the link never reached iCloud users; a password sends no email. `js/cloud.js`; the project (`pokedb-42e7c`, the user's) and its public web config is `FIREBASE_CONFIG` in `js/cloud-config.js` (not a secret;
the Firestore rules guard the data). While it's `null` the ☁️ Sign in item (`#cloud-btn`) and the title's PC stay
hidden and nothing changes. The title's top-left corner has its own way in once the gems are up: the games' PC
(`#title-account`, the 🖥️ pixel icon big, captioned Sign in / Cloud save, a green power light once signed in; the user's
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
the cloud's if this device has no progress (`isBlank()`). Sign out keeps the local save. The About erase uploads the
erased save too. Email links come back to the page with `?mode=signIn&oobCode=...`; the address is kept in
`pokedb.cloud.email` (asked again if the link opens in another browser) and the URL is cleaned. Firestore rules, and the
Firebase console steps, are in the roadmap's step 4; since the Safari leaderboard, `firestore.rules` in the repo is the
whole rules file (this rule plus `safariBoard`, docs/reference/safari.md). `cloudSession()` / `onCloudSignIn()` /
`openCloud()` are exported for `js/leaderboard.js`. Headless tests route gstatic to stand-in modules (the real SDK
can't be reached from a cloud session).

