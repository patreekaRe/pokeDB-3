/* ============================================================
   trainers.js  -  other players, on the Pokédex's Trainers app (docs/roadmap.md's "Friends list and base visits",
   session 1). Signed in, you publish a public page, trainers/<uid> (your name, Trainer Card, walking buddy and Secret
   Base), on every sign-in and each time you leave your base, under a friend code made once (codes/<CODE>). Your list
   of trainers is `save.friends`, so it travels with the cloud save. Adding is one way: type a code, or tap a name on
   any leaderboard, or in the Trainer Plaza (plaza/<uid>, everyone on lately who hasn't hidden), and leaves the trainer a
   note (adds/<them>_<you>) that pops up for them as the TRAINER LINK card (js/trainer-notice.js) and lists you under
   "Added you" till they add you back. "Trainers", not "Friends": that's the Gym Leaders' hearts app (js/friendsdex.js).
   The pure part (codes, the list, the doc) is js/data/trainers.js; the rules are firestore.rules'.
   Nothing here may hold up the game: every Firebase call is caught.
   ============================================================ */

import { TRAINERS, CODES, PLAZA, ADDS, PLAZA_SHOWN, rollCode, isCode, formatCode, parseCode, friendsOf, addFriend, dropFriend,
  trainerDoc, checkTrainer, lastSeen, cardDoc, blurbDoc, addId, addDoc, plazaPick, FRIENDS_MAX } from './data/trainers.js';
import { cloudConfigured, cloudRemembered, cloudSession, onCloudSignIn, openCloud } from './cloud.js';
import { getSave, updateSave } from './storage.js';
import { trainerName } from './leaderboard.js';
import { partnerKey, buddyKey, cardTier, badgeArt } from './trainercard.js';
import { BADGES } from './data/badges.js';
import { dexTally, safariOpen } from './data/pokedex.js';
import { safariDexCount } from './safaridex.js';
import { STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { ENEMY_DEFS } from './data/enemies.js';
import { isStarterUnlocked } from './progress.js';
import { shelfApp, typed } from './bagdex.js';
import { playCry, playSound } from './audio.js';
import { $, el } from './ui.js';
import { showTrainerNotices, noticeOpen } from './trainer-notice.js';

/* Your code, as this device last knew it: { uid, code }. Not in the save: writing it there while a first sign-in is still
   comparing saves would mark this device's copy changed and ask which to keep. Your page holds it for every device. */
const CODE_KEY = 'pokedb.trainer.code';
const readKept = () => { try { return JSON.parse(localStorage.getItem(CODE_KEY)) || {}; } catch (err) { return {}; } };
const keep = (uid, code) => { try { localStorage.setItem(CODE_KEY, JSON.stringify({ uid, code })); } catch (err) { /* blocked */ } };

/** Your code, if this device knows it (for `uid`, when given). */
export function myCode(uid = null) {
  if (!cloudRemembered()) return null;   // signed out: the code is the account's, not this device's
  const c = readKept();
  return isCode(c.code) && (!uid || c.uid === uid) ? c.code : null;
}

const TIER_INK = { green: ['#5ad08a', '#1e6a48'], bronze: ['#e09a5a', '#7a3a14'], silver: ['#b8c4d8', '#4a5670'], gold: ['#f0c840', '#7a5208'], violet: ['#b07af0', '#3e1a7a'] };

/** Your Trainer Card's numbers, as your page shows them. */
function myCard(save) {
  const dex = dexTally(save), safari = safariOpen(save) ? safariDexCount() : null;
  const earnable = new Set(BADGES.filter(b => !b.locked).map(b => b.id));
  return {
    tier: cardTier(save).id, badges: (save.badges || []).filter(id => earnable.has(id)), wins: save.stats.runsWon,
    dex: dex.n, dexOf: dex.total, safari: safari?.caught ?? 0, safariOf: safari?.total ?? 0,
    stars: Object.values(save.stats.level5WinsBy || {}).filter(n => n > 0).length,
    time: Math.floor((save.stats.playMs || 0) / 60000), partner: partnerKey(save),
  };
}

/** You in a line, for the Plaza and the notes you leave. */
const myBlurb = (save) => { const c = myCard(save); return blurbDoc({ name: trainerName(), buddy: buddyKey(save), partner: c.partner, tier: c.tier, badges: c.badges.length, wins: c.wins }); };

/** Your code: the one this device keeps, else the one on your page, else a new one claimed in codes/ (a clash rolls
    again). Kept the moment it's claimed, so a failed page write never makes a second. */
async function ensureCode(s) {
  const uid = s.user.uid, kept = myCode(uid);
  if (kept) return kept;
  const page = await s.F.getDoc(s.F.doc(s.db, TRAINERS, uid));
  let code = page.exists() && isCode(page.data().code) ? page.data().code : null;
  for (let tries = 0; !code && tries < 6; tries++) {
    const roll = rollCode();
    try { await s.F.setDoc(s.F.doc(s.db, CODES, roll), { uid }); code = roll; }
    catch (err) { if (err?.code !== 'permission-denied') throw err; }   // taken: someone else's, so roll again
  }
  if (!code) throw new Error('no code');
  keep(uid, code);
  return code;
}

let publishing = null;
/** Writes your page (signed in only). Resolves to your code, or null; never throws. */
export function publishTrainer() {
  if (!cloudConfigured() || !cloudRemembered()) return Promise.resolve(null);
  return (publishing ||= (async () => {
    try {
      const s = await cloudSession();
      if (!s.user) return null;
      const code = await ensureCode(s), save = getSave(), b = buddyKey(save);
      const doc = trainerDoc({ code, name: trainerName(), card: myCard(save), buddy: b, base: save.secretBase });
      if (checkTrainer(doc)) return code;
      await s.F.setDoc(s.F.doc(s.db, TRAINERS, s.user.uid), { ...doc, at: s.F.serverTimestamp() });
      const spot = s.F.doc(s.db, PLAZA, s.user.uid);
      if (save.plazaHidden) await s.F.deleteDoc(spot).catch(() => {});
      else await s.F.setDoc(spot, { ...myBlurb(save), at: s.F.serverTimestamp() }).catch(() => {});
      return code;
    } catch (err) { return myCode(); }
    finally { publishing = null; }
  })());
}

/** Adds a trainer by their uid (a leaderboard name): null when added, else why not ('self', 'already', 'full', 'bad'). */
export function addTrainer(uid, me) {
  const { list, why } = addFriend(friendsOf(getSave(), me), uid, me);
  if (!why) { updateSave(d => { d.friends = list; }); note(uid, true); }
  return why;
}

export function removeTrainer(uid) {
  updateSave(d => { d.friends = dropFriend(friendsOf(d), uid); });
  note(uid, false);
}

/** Leaves (or takes back) the note that tells `uid` you added them. Never throws. */
async function note(uid, on) {
  try {
    const s = await cloudSession();
    if (!s.user || uid === s.user.uid) return;
    const ref = s.F.doc(s.db, ADDS, addId(uid, s.user.uid));
    if (on) await s.F.setDoc(ref, { ...addDoc(s.user.uid, uid, myBlurb(getSave())), at: s.F.serverTimestamp() });
    else await s.F.deleteDoc(ref);
  } catch (err) { /* they just won't hear of it */ }
}

/** The notes left for you: { from, name, buddy, partner, tier, badges, wins, seen, at }, newest first. */
async function notesFor(s) {
  const q = s.F.query(s.F.collection(s.db, ADDS), s.F.where('to', '==', s.user.uid), s.F.limit(100));
  return (await s.F.getDocs(q)).docs.map(d => d.data())
    .filter(d => d && typeof d.from === 'string' && d.from !== s.user.uid && d.to === s.user.uid)
    .map(d => ({ ...blurbDoc(d), from: d.from, seen: d.seen === true, at: atOf(d) }))
    .sort((a, b) => b.at - a.at);
}
export const hasTrainer = (uid) => friendsOf(getSave()).includes(uid);
export const trainerCount = () => friendsOf(getSave()).length;

/** Adds a trainer from a typed code: a line to show. */
async function addByCode(text) {
  const code = parseCode(text);
  if (!code) return 'A code is 8 letters, like ABCD-EFGH.';
  let s;
  try { s = await cloudSession(); } catch (err) { return 'Can\'t reach the network right now. Are you online?'; }
  if (!s.user) return 'Sign in first.';
  let uid;
  try {
    const snap = await s.F.getDoc(s.F.doc(s.db, CODES, code));
    uid = snap.exists() ? snap.data().uid : null;
  } catch (err) { return 'Can\'t reach the network right now. Are you online?'; }
  if (!uid) return `No trainer has the code ${formatCode(code)}.`;
  const why = addTrainer(uid, s.user.uid);
  return { self: 'That\'s your own code!', already: 'They\'re already on your list.', full: `Your list is full (${FRIENDS_MAX}). Remove someone first.`, bad: 'That code didn\'t work.' }[why] ?? null;
}

/* ---------- a trainer's page, drawn from their doc. Only ever sprites from our own lists (a key, never a URL), and a
   Pokémon you haven't met yet (Mewtwo before it's yours) stays a silhouette. ---------- */

function sprite(key) {
  const [kind, id, a, b] = String(key || '').split(':');
  const save = getSave();
  if (kind === 'mon' && ENEMY_DEFS[id]) {
    const met = [...save.dex.seen, ...save.dex.defeated, ...(save.safariDex?.seen || []), ...(save.safariDex?.caught || [])].includes(id);
    return { src: ENEMY_DEFS[id].image, name: met ? ENEMY_DEFS[id].name : '???', masked: !met, cry: ENEMY_DEFS[id].spriteId ?? id };
  }
  const st = kind === 'starter' && STARTERS_BY_ID[id];
  if (!st) return { src: spriteUrl(STARTERS_BY_ID.charmander, 'front', 0), name: 'Charmander', cry: 'charmander' };
  const stage = /^\d$/.test(a ?? '') ? Math.min(+a, st.line.length - 1) : 0, shiny = a === 'shiny' || b === 'shiny';
  const masked = st.secret && !isStarterUnlocked(st);
  return { src: spriteUrl(st, 'front', stage, shiny), name: masked ? '???' : `${shiny ? 'Shiny ' : ''}${st.line[stage].name}`, masked, cry: st.line[stage].id };
}

function monImg(key, cls) {
  const m = sprite(key), img = el('img', `pixel ${cls}${m.masked ? ' unseen' : ''}`);
  img.src = m.src;
  img.alt = '';
  img.draggable = false;
  return img;
}

/** Someone else's page, made safe to draw: their card through cardDoc()'s bounds, or null if it isn't one. */
function readDoc(d) {
  if (!d || typeof d !== 'object' || typeof d.name !== 'string') return null;
  return { name: d.name.slice(0, 16) || 'TRAINER', card: cardDoc(d.card), buddy: typeof d.buddy === 'string' ? d.buddy : '', at: d.at };
}

const atOf = (doc) => (typeof doc?.at?.toMillis === 'function' ? doc.at.toMillis() : +doc?.at || 0);
const playTime = (min) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')}`;

function cardFacts(c) {
  const box = el('div', 'pdx-lcd pdx-facts lb-facts trn-facts');
  const fact = (k, v) => { const f = el('span', ''); f.append(el('b', '', `${k} `), v); return f; };
  box.append(fact('Wins', `${c.wins}`), fact('Pokédex', `${c.dex}/${c.dexOf}`), fact('Safari', c.safariOf ? `${c.safari}/${c.safariOf}` : '---'),
    fact('Stars', c.stars ? '⭐'.repeat(Math.min(c.stars, 3)) + (c.stars > 3 ? `×${c.stars}` : '') : '-'), fact('Time', playTime(c.time)));
  return box;
}

function badgeRow(c) {
  const ids = c.badges.filter(id => BADGES.some(b => b.id === id && !b.locked));
  const box = el('div', 'pdx-lcd trn-badges');
  const row = el('span', 'trn-badge-row');
  for (const id of ids.slice(-12)) { const img = el('img', ''); img.src = badgeArt(id, true); img.alt = ''; row.append(img); }
  box.append(el('b', '', `Badges ${ids.length}`), ids.length ? row : el('small', '', 'None yet'));
  return box;
}

/* ---------- the TRAINER LINK pop-up: each note not answered yet, once you're somewhere calm ---------- */

const RUN_SCREENS = ['map-screen', 'battle-screen', 'reward-screen'];
const calmNow = () => !noticeOpen() && !document.querySelector('dialog[open], .pc-screen') && !RUN_SCREENS.includes(document.body.dataset.screen)
  && $('collection-screen')?.hidden !== false;

function whenCalm(fn, tries = 0) {
  if (calmNow()) return fn();
  if (tries < 150) setTimeout(() => whenCalm(fn, tries + 1), 4000);
}

const asNotice = (n, mutual) => ({ ...n, uid: n.from, mon: sprite(n.buddy || n.partner), mutual });

/** On sign-in: anyone who added you since you last answered pops up (they keep their "Added you" banner till added). */
async function checkNotes() {
  let s;
  try { s = await cloudSession(); if (!s.user) return; } catch (err) { return; }
  let notes;
  try { notes = (await notesFor(s)).filter(n => !n.seen); } catch (err) { return; }
  if (!notes.length) return;
  const me = s.user.uid;
  setTimeout(() => whenCalm(() => showTrainerNotices(notes.map(n => asNotice(n, hasTrainer(n.from))), {
    addBack: (n) => { const why = addTrainer(n.uid, me); return !why || why === 'already'; },
    seen: (n) => { s.F.updateDoc(s.F.doc(s.db, ADDS, addId(me, n.uid)), { seen: true }).catch(() => {}); },
  })), 2500);
}

/** `?addnotice=N`: N stand-in adders pop up (the last one adding you back), nothing saved or sent. */
function sampleNotices(n) {
  const all = [
    { from: 'sample1', name: 'MISTY', tier: 'gold', badges: 24, wins: 31, buddy: 'starter:squirtle' },
    { from: 'sample2', name: 'BROCK', tier: 'silver', badges: 12, wins: 9, buddy: 'starter:bulbasaur:shiny' },
    { from: 'sample3', name: 'GARY', tier: 'violet', badges: 40, wins: 88, buddy: 'starter:charmander' },
  ];
  const list = all.slice(0, Math.max(1, Math.min(3, n || 1)));
  setTimeout(() => whenCalm(() => showTrainerNotices(list.map((x, i) => asNotice(x, i > 0 && i === list.length - 1)), { addBack: () => true, seen: () => {} })), 2500);
}

/* ---------- the app ---------- */

/** The Trainers app: your code, the add box and the Plaza switch on top; then "Added you" (who added you and isn't on
    your list), the Trainer Plaza (trainers on lately), and a banner for every trainer on your list, each opening the
    handheld on their Trainer Card, buddy, last seen, Visit (session 2) and Remove. One getDoc a trainer on your list
    or who added you, and one query each for the notes and the Plaza, each time it opens. */
export function trainersApp() {
  let panel = null, shelf = null, me = null, code = null, docs = new Map(), notes = [], plaza = [], state = 'loading', said = '', removing = null;

  const blurbOf = (uid) => plaza.find(e => e.uid === uid) ?? notes.find(n => n.from === uid) ?? null;
  const nameOf = (uid) => docs.get(uid)?.name ?? blurbOf(uid)?.name ?? '???';
  const partnerOf = (uid) => docs.get(uid)?.card?.partner || blurbOf(uid)?.partner;
  const buddyOf = (uid) => docs.get(uid)?.buddy || blurbOf(uid)?.buddy || partnerOf(uid);
  const adders = () => notes.filter(n => !hasTrainer(n.from)).map(n => n.from);

  function topBox() {
    const box = el('div', 'lb-top trn-top');
    if (!cloudConfigured()) { box.append(el('p', 'pdx-lcd lb-note', 'Trainers aren\'t available in this version of the game.')); return box; }
    if (state === 'signin') {
      const row = el('div', 'pdx-lcd lb-signin');
      const btn = el('button', 'lb-btn primary', 'Sign in');
      btn.type = 'button';
      btn.addEventListener('click', openCloud);
      row.append(el('p', '', 'Sign in to get your trainer code, meet trainers in the Trainer Plaza and add them.'), btn);
      box.append(row);
      return box;
    }
    if (state === 'offline') { box.append(el('p', 'pdx-lcd lb-note', 'The trainer network can\'t be reached right now (offline?). The game itself is unaffected.')); return box; }
    const mine = el('div', 'pdx-lcd trn-code');
    mine.append(el('small', '', 'Your trainer code'), el('b', 'trn-code-text', code ? formatCode(code) : state === 'loading' ? 'Loading…' : '---'));
    const form = el('form', 'pdx-lcd trn-add');
    const input = el('input', 'lb-name-input trn-input');
    Object.assign(input, { placeholder: 'ABCD-EFGH', maxLength: 12, autocomplete: 'off', spellcheck: false });
    input.setAttribute('aria-label', 'A trainer\'s code');
    input.autocapitalize = 'characters';
    const btn = el('button', 'lb-btn primary', 'Add');
    btn.type = 'submit';
    const line = el('p', 'trn-said', said || 'Type a friend\'s code, or find trainers in the Plaza and on any leaderboard.');
    form.append(el('strong', '', 'Add a trainer'), input, btn, line);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      btn.disabled = true;
      line.textContent = 'Looking…';
      const why = await addByCode(input.value);
      if (!panel) return;
      said = why ?? 'Added! They\'ll see a TRAINER LINK next time they play.';
      playSound(why ? 'cancel' : 'confirm');
      if (why) { line.textContent = said; btn.disabled = false; return; }
      load();
    });
    const hidden = !!getSave().plazaHidden;
    const spot = el('div', 'pdx-lcd trn-spot');
    const flip = el('button', 'lb-btn', hidden ? 'Show me' : 'Hide me');
    flip.type = 'button';
    flip.addEventListener('click', async () => {
      flip.disabled = true;
      playSound('confirm');
      updateSave(d => { d.plazaHidden = !hidden; });
      await publishTrainer();
      if (panel) load();
    });
    spot.append(el('span', '', hidden ? 'You\'re hidden from the Trainer Plaza.' : 'You\'re in the Trainer Plaza.'), flip);
    box.append(mine, form, spot);
    return box;
  }

  function groups() {
    const out = [];
    const waiting = adders();
    if (waiting.length) out.push({ id: 'added', name: 'Added you', sub: `${waiting.length} trainer${waiting.length === 1 ? '' : 's'} to add back`, b1: '#ffd860', b2: '#c8601a', cls: 'trn-banner trn-added', list: adders });
    if (state === 'ready') out.push({ id: 'plaza', name: 'Trainer Plaza', sub: 'Trainers on lately', b1: '#6ad8e8', b2: '#1a4a8a', cls: 'trn-banner trn-plaza', list: () => plaza.map(e => e.uid) });
    for (const uid of friendsOf(getSave(), me)) {
      const doc = docs.get(uid), ink = TIER_INK[doc?.card?.tier] ?? ['#8a96a8', '#3a4458'];
      out.push({ id: uid, friend: true, name: doc?.name ?? (state === 'loading' ? '…' : '???'), sub: doc ? lastSeen(atOf(doc)) : state === 'loading' ? 'Loading…' : 'Not on the network yet',
        b1: ink[0], b2: ink[1], cls: 'trn-banner', list: () => [uid] });
    }
    return out;
  }

  /** Add / Add back on someone not on your list (the Plaza, Added you), or where they stand. */
  function addKeys(uid, back) {
    const keys = el('div', 'trn-keys');
    const on = hasTrainer(uid);
    const b = el('button', `lb-btn primary trn-addkey${on ? ' on' : ''}`, on ? '✓ On your list' : back ? 'Add back' : '+ Add');
    b.type = 'button';
    b.disabled = on;
    b.addEventListener('click', () => {
      const why = addTrainer(uid, me);
      playSound(why && why !== 'already' ? 'cancel' : 'item-get');
      said = why === 'full' ? `Your list is full (${FRIENDS_MAX}). Remove someone first.` : `${nameOf(uid)} is on your list now!`;
      remount();
    });
    keys.append(b);
    return keys;
  }

  function friendKeys(uid) {
    const keys = el('div', 'trn-keys');
    const visit = el('button', 'lb-btn trn-visit', 'Visit');
    visit.type = 'button';
    visit.disabled = true;
    visit.title = 'Visiting a trainer\'s Secret Base is coming soon.';
    const remove = el('button', `lb-btn trn-remove${removing === uid ? ' sure' : ''}`, removing === uid ? 'Tap again to remove' : 'Remove');
    remove.type = 'button';
    remove.addEventListener('click', () => {
      if (removing !== uid) { removing = uid; playSound('confirm'); remove.textContent = 'Tap again to remove'; remove.classList.add('sure'); return; }
      removing = null;
      playSound('cancel');
      removeTrainer(uid);
      said = '';
      remount();
    });
    keys.append(visit, remove);
    return keys;
  }

  function blurbFacts(b) {
    const box = el('div', 'pdx-lcd pdx-facts lb-facts trn-facts');
    const fact = (k, v) => { const f = el('span', ''); f.append(el('b', '', `${k} `), v); return f; };
    box.append(fact('Card', `${b.tier[0].toUpperCase()}${b.tier.slice(1)}`), fact('Badges', `${b.badges}`), fact('Wins', `${b.wins}`));
    return box;
  }

  function build() {
    return shelfApp({
      groups: groups(),
      deviceCls: 'trn-device',
      known: (g, uid) => docs.has(uid) || !!blurbOf(uid),
      no: (g, uid) => (g.friend ? `No.${String(friendsOf(getSave(), me).indexOf(uid) + 1).padStart(2, '0')}` : `${g.list().indexOf(uid) + 1}/${g.list().length}`),
      label: (g, uid) => nameOf(uid),
      count: (g, things) => {
        if (!g.friend) return `${things.length}`;
        const c = docs.get(g.id)?.card;
        return c ? `${c.badges.length} badge${c.badges.length === 1 ? '' : 's'}` : '';
      },
      art: (g, uid, known, where) => monImg(buddyOf(uid), where === 'banner' ? 'bdx-banner-mon' : 'pdx-slot-mon'),
      screen(g, uid) {
        const tier = docs.get(uid)?.card?.tier ?? blurbOf(uid)?.tier, nodes = [el('span', 'pdx-pad'), monImg(partnerOf(uid), 'pdx-mon bdx-art')];
        if (tier) nodes.push(el('span', 'pdx-role trn-role', `${tier[0].toUpperCase()}${tier.slice(1)} card`));
        return nodes;
      },
      lines(g, uid) {
        const doc = docs.get(uid), b = blurbOf(uid), keys = g.friend ? friendKeys(uid) : addKeys(uid, g.id === 'added');
        const walk = sprite(buddyOf(uid));
        if (doc) return [typed('', `${doc.name}'s Trainer Card. ${lastSeen(atOf(doc))}.`), cardFacts(doc.card), badgeRow(doc.card), typed('', `Walking with ${walk.name}.`), keys,
          ...(g.friend ? [typed('muted', 'Base visits are coming soon.')] : [])];
        if (b) return [typed('', g.id === 'added' ? `${b.name} added you ${lastSeen(b.at).replace(/^Seen |^Online /, '')}.` : `${b.name}. ${lastSeen(b.at)}.`), blurbFacts(b), typed('', `Walking with ${walk.name}.`), keys];
        return [typed('muted', 'They haven\'t been on since Trainers came in.'), typed('muted', 'They\'ll show up here once they play signed in.'), keys];
      },
      tally: (g) => (g.id === 'plaza' ? 'Trainers in the Plaza' : g.id === 'added' ? 'Trainers who added you' : 'Trainer Card'),
      empty: (g) => (g.id === 'plaza' ? 'Nobody\'s here yet. Check back soon!' : ''),
      onShow: (g, uid) => { removing = null; const m = sprite(partnerOf(uid)); if (partnerOf(uid) && !m.masked) playCry(m.cry); },
      top: topBox,
    });
  }

  function remount() {
    if (!panel) return;
    shelf?.unmount();
    shelf = build();
    panel.replaceChildren();
    shelf.mount(panel);
    if (!friendsOf(getSave(), me).length && state === 'ready') panel.querySelector('.pdx-banners')?.append(el('p', 'pdx-lcd lb-note trn-none', 'No trainers on your list yet. Meet some in the Trainer Plaza, or swap codes with a friend!'));
  }

  async function load() {
    const at = panel;
    state = 'loading';
    remount();
    if (!cloudConfigured()) return;
    let s;
    try { s = await cloudSession(); } catch (err) { if (panel === at) { state = 'offline'; remount(); } return; }
    if (panel !== at) return;
    if (!s.user) { state = 'signin'; remount(); return; }
    me = s.user.uid;
    code = myCode(me) ?? await publishTrainer();
    const [gotNotes, gotPlaza] = await Promise.all([
      notesFor(s).catch(() => []),
      s.F.getDocs(s.F.query(s.F.collection(s.db, PLAZA), s.F.orderBy('at', 'desc'), s.F.limit(PLAZA_SHOWN + 1)))
        .then(q => q.docs.map(d => ({ ...blurbDoc(d.data()), uid: d.id, at: atOf(d.data()) })), () => null),
    ]);
    notes = gotNotes;
    plaza = plazaPick(gotPlaza ?? [], me);
    const want = [...new Set([...friendsOf(getSave(), me), ...adders()])];
    const got = await Promise.all(want.map(uid => s.F.getDoc(s.F.doc(s.db, TRAINERS, uid)).then(d => (d.exists() ? d.data() : null), () => undefined)));
    if (panel !== at) return;
    state = gotPlaza === null && got.every(d => d === undefined) ? 'offline' : 'ready';
    docs = new Map(want.map((uid, i) => [uid, readDoc(got[i])]).filter(([, d]) => d));
    remount();
  }

  return {
    mount(p) { panel = p; said = ''; removing = null; load(); },
    back: () => shelf?.back() || false,
    key: (e) => shelf?.key(e) || false,
    press: () => shelf?.press(),
    unmount() { shelf?.unmount(); shelf = null; panel = null; },
  };
}

export function initTrainers() {
  const sample = new URLSearchParams(location.search).get('addnotice');
  if (sample !== null) sampleNotices(+sample);
  if (!cloudConfigured()) return;
  onCloudSignIn(() => { publishTrainer().then(checkNotes); });
}
