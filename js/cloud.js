/* ============================================================
   cloud.js  -  the optional cloud save (Firebase), from the Pokédex's Settings.

   Signed out, nothing here runs: the Firebase SDK is only downloaded once
   you've signed in on this device (or tap Sign in). Signed in, both
   localStorage keys (storage.js's SAVE_KEYS) are copied as they are to one
   Firestore document, saves/<uid>, a few seconds after every write.

   Each upload gets a random `rev`, and this device remembers the last rev
   it agreed with (pokedb.cloud.v1). On load, and on every upload:
     - the cloud's rev moved, this device didn't change -> take the cloud's (a reload)
     - this device changed, the cloud's rev didn't move  -> upload
     - both moved                                        -> ask which to keep
   The first sign-in on a device uploads its save when the cloud has none,
   takes the cloud's when this device has no progress, and asks otherwise.
   ============================================================ */

import { FIREBASE_CONFIG } from './cloud-config.js';
import { SAVE_KEYS, onSaveWrite } from './storage.js';
import { STARTERS, STARTERS_BY_ID, stageName } from './data/starters.js';
import { biomeAt } from './data/enemies.js';
import { $, el, openDialog, closeDialog } from './ui.js';
import { playSound, preloadSounds } from './audio.js';

const SDK = 'https://www.gstatic.com/firebasejs/12.19.0/';
const STATE_KEY = 'pokedb.cloud.v1';
const EMAIL_KEY = 'pokedb.cloud.email';
const UPLOAD_DELAY = 4000;
const CONFLICT = new Error('conflict');

let fb = null;
let user = null;
let status = { kind: '', at: 0 };
let timer = 0;
let uploading = null;
let again = false;
let conflict = null;       // the cloud's copy, while the player hasn't picked a save
let linkPending = false;   // an email link was opened here, but this browser doesn't know the address

const store = {
  get(key) { try { return localStorage.getItem(key); } catch (err) { return null; } },
  set(key, value) {
    try { value == null ? localStorage.removeItem(key) : localStorage.setItem(key, value); }
    catch (err) { /* blocked */ }
  },
};
const readState = () => { try { return JSON.parse(store.get(STATE_KEY)) || {}; } catch (err) { return {}; } };
const writeState = (state) => store.set(STATE_KEY, JSON.stringify(state));
const readLocal = () => ({ save: store.get(SAVE_KEYS.save), run: store.get(SAVE_KEYS.run) });
const newRev = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

async function sdk() {
  if (fb) return fb;
  const [app, auth, fs] = await Promise.all(
    ['firebase-app', 'firebase-auth', 'firebase-firestore-lite'].map(name => import(`${SDK}${name}.js`)));
  const firebase = app.initializeApp(FIREBASE_CONFIG);
  fb = { A: auth, F: fs, auth: auth.getAuth(firebase), db: fs.getFirestore(firebase) };
  return fb;
}
const docRef = () => fb.F.doc(fb.db, 'saves', user.uid);

function deviceName() {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad|Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return 'iPad';
  if (/Android/.test(ua)) return /Mobile/.test(ua) ? 'Android phone' : 'Android tablet';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/Macintosh/.test(ua)) return 'Mac';
  return 'a browser';
}

function ago(time) {
  if (!time) return 'never';
  const min = Math.round((Date.now() - time) / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  if (min < 24 * 60) return `${Math.round(min / 60)} h ago`;
  return new Date(time).toLocaleDateString();
}

/** A save with no progress in it: taking the cloud's over it loses nothing. */
function isBlank({ save, run }) {
  if (run) return false;
  if (!save) return true;
  try {
    const s = JSON.parse(save);
    return !s.coins && !(s.unlocked || []).length && !s.stats?.runsStarted && !(s.dex?.seen || []).length;
  } catch (err) { return true; }
}

/* ---------- syncing ---------- */

function changed() {
  const state = readState();
  if (!state.uid) return;
  writeState({ ...state, dirty: true, localAt: Date.now() });
  if (!user || conflict) return;
  clearTimeout(timer);
  timer = setTimeout(upload, UPLOAD_DELAY);
}

async function reconcile() {
  const state = readState();
  const first = state.uid !== user.uid;
  if (first) writeState({ uid: user.uid, rev: null, dirty: !isBlank(readLocal()), localAt: state.localAt || Date.now() });
  setStatus('saving');
  let cloud;
  try {
    const snap = await fb.F.getDoc(docRef());
    cloud = snap.exists() ? snap.data() : null;
  } catch (err) { return setStatus('offline'); }
  const local = readLocal();
  const now = readState();
  if (!cloud) return upload();
  if (cloud.save === local.save && cloud.run === local.run) {
    writeState({ ...now, rev: cloud.rev, dirty: false });
    return setStatus('saved', cloud.savedAt);
  }
  const cloudMoved = cloud.rev !== now.rev;
  if (!cloudMoved) return upload();
  if (!now.dirty && (first || onTitle())) return takeCloud(cloud);
  ask(cloud);
}

async function upload() {
  clearTimeout(timer);
  if (!user || conflict) return;
  if (uploading) { again = true; return; }
  uploading = (async () => {
    setStatus('saving');
    const { rev: agreed, localAt } = readState();
    const rev = newRev();
    const savedAt = Date.now();
    let theirs = null;
    try {
      await fb.F.runTransaction(fb.db, async (t) => {
        const snap = await t.get(docRef());
        if (snap.exists() && snap.data().rev !== agreed) { theirs = snap.data(); throw CONFLICT; }
        t.set(docRef(), { ...readLocal(), rev, savedAt, device: deviceName() });
      });
      const state = readState();
      writeState({ ...state, rev, dirty: state.localAt !== localAt });
      setStatus('saved', savedAt);
    } catch (err) {
      if (err === CONFLICT || theirs) ask(theirs);
      else setStatus('offline');
    }
  })();
  await uploading;
  uploading = null;
  if (again) { again = false; upload(); }
}

function takeCloud(cloud) {
  store.set(SAVE_KEYS.save, cloud.save);
  store.set(SAVE_KEYS.run, cloud.run);
  writeState({ uid: user.uid, rev: cloud.rev, dirty: false, localAt: cloud.savedAt });
  location.reload();
}

const onTitle = () => !$('title-screen').hidden;

/* ---------- two saves: pick one ---------- */

function describe({ save, run }) {
  const lines = [];
  let s = {};
  try { s = JSON.parse(save) || {}; } catch (err) { /* unreadable: show it as empty */ }
  const owned = STARTERS.filter(st => st.free || (s.unlocked || []).includes(st.id)).length;
  lines.push(`💰 ${s.coins || 0} PokéCoins`);
  lines.push(`Starters: ${owned}/${STARTERS.length}`);
  lines.push(`Runs won: ${s.stats?.runsWon || 0}`);
  lines.push(`Pokédex: ${(s.dex?.defeated || []).length} defeated`);
  let r = null;
  try { r = run && JSON.parse(run); } catch (err) { /* no run */ }
  const starter = r && STARTERS_BY_ID[r.starter];
  lines.push(starter
    ? `Run: ${stageName(starter, r.stage)}, ${biomeAt(r.route, r.biome)?.name ?? `biome ${r.biome + 1}`}, HP ${r.hp}/${r.maxHp}`
    : 'No run in progress');
  return lines;
}

function fillSave(box, title, when, data, keep) {
  box.replaceChildren(el('h3', '', title), el('p', 'hint', when));
  const list = el('ul', 'cloud-lines');
  for (const line of describe(data)) list.append(el('li', '', line));
  const button = el('button', 'btn primary', 'Keep this one');
  button.addEventListener('click', keep);
  box.append(list, button);
}

function ask(cloud) {
  conflict = cloud;
  clearTimeout(timer);
  setStatus('conflict');
  fillSave($('cloud-save-here'), 'This device', `Changed ${ago(readState().localAt)}`, readLocal(), keepHere);
  fillSave($('cloud-save-cloud'), 'Cloud', `Saved ${ago(cloud.savedAt)} on ${cloud.device || 'another device'}`, cloud, keepCloud);
  if ($('cloud-dialog').open) closeDialog('cloud-dialog');
  openDialog('cloud-pick-dialog');
}

function keepHere() {
  const cloud = conflict;
  conflict = null;
  closeDialog('cloud-pick-dialog');
  writeState({ ...readState(), rev: cloud.rev, dirty: true });
  upload();
}

function keepCloud() {
  closeDialog('cloud-pick-dialog');
  takeCloud(conflict);
}

/* ---------- signing in ---------- */

function isEmailLink() {
  const q = new URLSearchParams(location.search);
  return q.get('mode') === 'signIn' && q.has('oobCode');
}

function cleanUrl() {
  const q = new URLSearchParams(location.search);
  for (const key of ['apiKey', 'oobCode', 'mode', 'lang', 'continueUrl', 'tenantId']) q.delete(key);
  const rest = q.toString();
  history.replaceState(null, '', location.pathname + (rest ? `?${rest}` : '') + location.hash);
}

async function finishEmailLink(email) {
  try {
    await fb.A.signInWithEmailLink(fb.auth, email, location.href);
    store.set(EMAIL_KEY, null);
    linkPending = false;
    cleanUrl();
  } catch (err) {
    linkPending = false;
    cleanUrl();
    note(err.code === 'auth/invalid-email' ? 'That isn\'t the address the link was sent to.'
      : 'That sign-in link has expired or was already used. Ask for a new one.');
    openCloud();
  }
}

let connecting = null;
const connect = () => (connecting ||= start());
let authKnown;                               // resolves once Firebase has said who's signed in (or nobody)
const authReady = new Promise(resolve => { authKnown = resolve; });
const userListeners = [];

async function start() {
  await sdk();
  fb.A.onAuthStateChanged(fb.auth, (u) => {
    const was = user;
    user = u;
    authKnown();
    render();
    if (u && u.uid !== was?.uid) { reconcile(); for (const fn of userListeners) { try { fn(u); } catch (err) { /* never the save's problem */ } } }
    if (!u && readState().uid && !linkPending) writeState({});
  });
  if (isEmailLink() && fb.A.isSignInWithEmailLink(fb.auth, location.href)) {
    const email = store.get(EMAIL_KEY);
    if (email) return finishEmailLink(email);
    linkPending = true;
    note('Type your email again to finish signing in.');
    openCloud();
  }
}

async function signInGoogle() {
  note('');
  try {
    if (!fb) await connect();
    await fb.A.signInWithPopup(fb.auth, new fb.A.GoogleAuthProvider());
  } catch (err) {
    if (err.code === 'auth/popup-blocked') return fb.A.signInWithRedirect(fb.auth, new fb.A.GoogleAuthProvider());
    if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') note(failed(err));
  }
}

async function sendLink(email) {
  note('Sending…');
  try {
    await connect();
    if (linkPending) return finishEmailLink(email);
    const url = location.origin + location.pathname;
    await fb.A.sendSignInLinkToEmail(fb.auth, email, { url, handleCodeInApp: true });
    store.set(EMAIL_KEY, email);
    note(`Sent! Open the email on this device and tap its link. Open it in the same browser you play in.`);
  } catch (err) { note(failed(err)); }
}

async function withPassword(email, password, create) {
  if (!email) return note('Type your email first.');
  if (!password) return note('Type a password too, or tap "Email me a link instead".');
  note(create ? 'Making your account…' : 'Signing in…');
  try {
    await connect();
    const signIn = create ? fb.A.createUserWithEmailAndPassword : fb.A.signInWithEmailAndPassword;
    await signIn(fb.auth, email, password);
    $('cloud-password').value = '';
    note('');
  } catch (err) { note(failed(err)); }
}

async function resetPassword(email) {
  if (!email) return note('Type your email first, then tap Forgot password.');
  note('Sending…');
  try {
    await connect();
    await fb.A.sendPasswordResetEmail(fb.auth, email);
    note('If that address has an account, a reset email is on its way. Check your junk folder too.');
  } catch (err) { note(failed(err)); }
}

const failed = (err) => (err.code === 'auth/network-request-failed' ? 'No connection. Try again when you\'re online.'
  : err.code === 'auth/invalid-email' ? 'That email address doesn\'t look right.'
  : err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found'
    ? 'Wrong email or password. New here? Tap Sign up.'
  : err.code === 'auth/email-already-in-use' ? 'That email already has an account. Tap Sign in instead.'
  : err.code === 'auth/weak-password' ? 'Pick a password of at least 6 characters.'
  : err.code === 'auth/too-many-requests' ? 'Too many tries. Wait a few minutes and try again.'
  : `Sign-in didn't work (${err.code || err.message}).`);

async function signOut() {
  await fb.A.signOut(fb.auth);
  writeState({});
  conflict = null;
  note('Signed out. This device keeps its save, but won\'t sync until you sign in again.');
}

/* ---------- the window ---------- */

function setStatus(kind, at) {
  status = { kind, at: at ?? status.at };
  render();
}

function note(text) { $('cloud-note').textContent = text; }

function render() {
  const signedIn = !!user;
  $('cloud-btn').querySelector('.mi-label').textContent = signedIn ? 'Cloud save' : 'Sign in';
  $('title-account-text').textContent = signedIn ? 'Cloud save' : 'Sign in';
  $('title-account').setAttribute('aria-label', signedIn ? 'Cloud save' : 'Sign in');
  $('title-account').classList.toggle('on', signedIn);
  $('cloud-out').hidden = signedIn;
  $('cloud-in').hidden = !signedIn;
  $('cloud-signout').hidden = !signedIn;
  // a link opened in a browser that doesn't know its address: only the email box and Sign in are needed
  for (const id of ['cloud-google', 'cloud-or', 'cloud-password', 'cloud-create', 'cloud-extra']) $(id).hidden = linkPending;
  if (!signedIn) return;
  $('cloud-who').textContent = user.email || user.displayName || 'you';
  $('cloud-status').textContent = {
    saving: 'Saving to the cloud…',
    saved: `Saved to the cloud ${ago(status.at)}.`,
    offline: 'Can\'t reach the cloud right now. Your progress is safe here and will upload when you\'re back online.',
    conflict: 'This device and the cloud have different saves.',
  }[status.kind] || '';
  $('cloud-choose').hidden = status.kind !== 'conflict';
}

export function openCloud() {
  render();
  if (!$('cloud-dialog').open) openDialog('cloud-dialog');
}

/* ---------- for the Safari leaderboard (js/leaderboard.js) ---------- */

export const cloudConfigured = () => Boolean(FIREBASE_CONFIG);
/** Signed in on this device, by its last known state, without loading anything. */
export const cloudRemembered = () => Boolean(readState().uid);
/** Firestore and the signed-in user (or null), loading the SDK if needed. Throws when Firebase can't be reached. */
export async function cloudSession() {
  if (!FIREBASE_CONFIG) throw new Error('no config');
  try { await connect(); } catch (err) { connecting = null; throw err; }
  await Promise.race([authReady, new Promise(resolve => setTimeout(resolve, 8000))]);
  return { F: fb.F, db: fb.db, user };
}
/** Called with the user each time someone signs in. */
export const onCloudSignIn = (fn) => { userListeners.push(fn); };

export function initCloud() {
  if (!FIREBASE_CONFIG) return;
  $('cloud-btn').hidden = false;
  $('title-account').hidden = false;
  preloadSounds('pc-on', 'pc-off');   // loaded before the tap, so they replace the menu blip instead of trailing it
  $('cloud-btn').addEventListener('click', openCloud);
  $('title-account').addEventListener('click', () => {
    playSound('pc-on');
    $('cloud-dialog').dataset.closeSound = 'pc-off';   // logging off the PC as its window closes, in place of cancel
    openCloud();
  });
  $('cloud-dialog').addEventListener('close', () => {
    const sound = $('cloud-dialog').dataset.closeSound;
    delete $('cloud-dialog').dataset.closeSound;
    if (sound) playSound(sound);
  });
  $('cloud-google').addEventListener('click', signInGoogle);
  const email = () => $('cloud-email').value.trim();
  $('cloud-email-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (linkPending) sendLink(email());
    else withPassword(email(), $('cloud-password').value, false);
  });
  $('cloud-create').addEventListener('click', () => withPassword(email(), $('cloud-password').value, true));
  $('cloud-link').addEventListener('click', () => {
    if (!$('cloud-email').reportValidity()) return;
    sendLink(email());
  });
  $('cloud-forgot').addEventListener('click', () => resetPassword(email()));
  $('cloud-signout').addEventListener('click', signOut);
  $('cloud-choose').addEventListener('click', () => ask(conflict));
  onSaveWrite(changed);
  const flush = () => { if (user && readState().dirty && !conflict) upload(); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
  addEventListener('online', flush);
  if (readState().uid || isEmailLink()) connect().catch(() => setStatus('offline'));
  // load the SDK while the window is open, so Google's popup opens straight from the tap (browsers block late ones)
  const preload = () => {
    connect().catch(() => { connecting = null; note('Can\'t reach the sign-in service. Are you online?'); });
  };
  $('cloud-btn').addEventListener('click', preload);
  $('title-account').addEventListener('click', preload);
  render();
}
