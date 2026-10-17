/* ============================================================
   trainers.js  -  other players, on the Pokédex's Trainers app (docs/roadmap.md's "Friends list and base visits",
   session 1). Signed in, you publish a public page, trainers/<uid> (your name, Trainer Card, walking buddy and Secret
   Base), on every sign-in and each time you leave your base, under a friend code made once (codes/<CODE>). Your list
   of trainers is `save.friends`, so it travels with the cloud save. Adding is one way: type a code, or tap a name on
   any leaderboard. "Trainers", not "Friends": that's the Gym Leaders' hearts app (js/friendsdex.js).
   The pure part (codes, the list, the doc) is js/data/trainers.js; the rules are firestore.rules'.
   Nothing here may hold up the game: every Firebase call is caught.
   ============================================================ */

import { TRAINERS, CODES, rollCode, isCode, formatCode, parseCode, friendsOf, addFriend, dropFriend, trainerDoc, checkTrainer,
  lastSeen, cardDoc, FRIENDS_MAX, BASE_MAX } from './data/trainers.js';
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
import { el } from './ui.js';

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
      return code;
    } catch (err) { return myCode(); }
    finally { publishing = null; }
  })());
}

/** Adds a trainer by their uid (a leaderboard name): null when added, else why not ('self', 'already', 'full', 'bad'). */
export function addTrainer(uid, me) {
  const { list, why } = addFriend(friendsOf(getSave(), me), uid, me);
  if (!why) updateSave(d => { d.friends = list; });
  return why;
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
  return { name: d.name.slice(0, 16) || 'TRAINER', card: cardDoc(d.card), buddy: typeof d.buddy === 'string' ? d.buddy : '', at: d.at,
    base: typeof d.base === 'string' && d.base.length <= BASE_MAX ? d.base : '' };
}

/* Visit: main.js hands over the way into a friend's base (openBase3d({ guest }) in js/base-3d.js), so this file never
   loads the furniture to draw the app. It resolves false if their base couldn't be read, 'run' during a run. */
let visitor = null;
export const onVisit = (fn) => { visitor = fn; };

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

/* ---------- the app ---------- */

/** The Trainers app: your code and the add box on top, then a banner for every trainer on your list, each opening the
    handheld on their Trainer Card, their buddy, when they were last seen, Visit (session 2) and Remove. One getDoc a
    trainer each time it opens. */
export function trainersApp() {
  let panel = null, shelf = null, me = null, code = null, docs = new Map(), state = 'loading', said = '', removing = null;

  function topBox() {
    const box = el('div', 'lb-top trn-top');
    if (!cloudConfigured()) { box.append(el('p', 'pdx-lcd lb-note', 'Trainers aren\'t available in this version of the game.')); return box; }
    if (state === 'signin') {
      const row = el('div', 'pdx-lcd lb-signin');
      const btn = el('button', 'lb-btn primary', 'Sign in');
      btn.type = 'button';
      btn.addEventListener('click', openCloud);
      row.append(el('p', '', 'Sign in to get your trainer code and add other trainers.'), btn);
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
    const line = el('p', 'trn-said', said || 'Type a friend\'s code, or tap a name on any leaderboard.');
    form.append(el('strong', '', 'Add a trainer'), input, btn, line);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      btn.disabled = true;
      line.textContent = 'Looking…';
      const why = await addByCode(input.value);
      if (!panel) return;
      said = why ?? 'Added!';
      playSound(why ? 'cancel' : 'confirm');
      if (why) { line.textContent = said; btn.disabled = false; return; }
      load();
    });
    box.append(mine, form);
    return box;
  }

  const groups = () => friendsOf(getSave(), me).map(uid => {
    const doc = docs.get(uid), ink = TIER_INK[doc?.card?.tier] ?? ['#8a96a8', '#3a4458'];
    return {
      id: uid, name: doc?.name ?? (state === 'loading' ? '…' : '???'), sub: doc ? lastSeen(atOf(doc)) : state === 'loading' ? 'Loading…' : 'Not on the network yet',
      b1: ink[0], b2: ink[1], cls: 'trn-banner', list: () => [uid],
    };
  });

  function build() {
    return shelfApp({
      groups: groups(),
      deviceCls: 'trn-device',
      known: (g, uid) => docs.has(uid),
      no: (g, uid) => `No.${String(friendsOf(getSave(), me).indexOf(uid) + 1).padStart(2, '0')}`,
      label: (g, uid) => docs.get(uid)?.name ?? '???',
      count: (g) => { const c = docs.get(g.id)?.card; return c ? `${c.badges.length} badge${c.badges.length === 1 ? '' : 's'}` : ''; },
      art: (g, uid, known, where) => monImg(docs.get(uid)?.buddy || docs.get(uid)?.card?.partner, where === 'banner' ? 'bdx-banner-mon' : 'pdx-slot-mon'),
      screen(g, uid, known) {
        const doc = docs.get(uid), nodes = [el('span', 'pdx-pad'), monImg(doc?.card?.partner, 'pdx-mon bdx-art')];
        if (doc) nodes.push(el('span', 'pdx-role trn-role', `${doc.card.tier[0].toUpperCase()}${doc.card.tier.slice(1)} card`));
        return nodes;
      },
      lines(g, uid, known) {
        const doc = docs.get(uid);
        const keys = el('div', 'trn-keys');
        const visit = el('button', 'lb-btn trn-visit', 'Visit');
        visit.type = 'button';
        visit.disabled = !doc?.base || !visitor;
        visit.title = doc?.base ? `Walk round ${doc.name}'s Secret Base` : 'They haven\'t made a Secret Base yet.';
        visit.addEventListener('click', async () => {
          visit.disabled = true;
          playSound('confirm');
          const went = await visitor({ name: doc.name, json: doc.base });
          if (went !== false && went !== 'run') return;
          playSound('cancel');
          visit.textContent = went === 'run' ? 'Not mid-run' : 'Can\'t open it';
        });
        const remove = el('button', `lb-btn trn-remove${removing === uid ? ' sure' : ''}`, removing === uid ? 'Tap again to remove' : 'Remove');
        remove.type = 'button';
        remove.addEventListener('click', () => {
          if (removing !== uid) { removing = uid; playSound('confirm'); remove.textContent = 'Tap again to remove'; remove.classList.add('sure'); return; }
          removing = null;
          playSound('cancel');
          updateSave(d => { d.friends = dropFriend(friendsOf(d), uid); });
          said = '';
          remount();
        });
        keys.append(visit, remove);
        if (!doc) return [typed('muted', 'They haven\'t been on since Trainers came in.'), typed('muted', 'They\'ll show up here once they play signed in.'), keys];
        const walk = sprite(doc.buddy);
        return [typed('', `${doc.name}'s Trainer Card. ${lastSeen(atOf(doc))}.`), cardFacts(doc.card), badgeRow(doc.card),
          typed('', `Walking with ${walk.name}.`), keys, typed('muted', doc.base ? 'Visit walks round their Secret Base as they last left it.' : 'No Secret Base to visit yet.')];
      },
      tally: () => 'Trainer Card',
      empty: () => '',
      onShow: (g, uid) => { removing = null; const doc = docs.get(uid); if (doc && !sprite(doc.card.partner).masked) playCry(sprite(doc.card.partner).cry); },
      top: topBox,
    });
  }

  function remount() {
    if (!panel) return;
    shelf?.unmount();
    shelf = build();
    panel.replaceChildren();
    shelf.mount(panel);
    if (!friendsOf(getSave(), me).length && state === 'ready') panel.querySelector('.pdx-banners')?.append(el('p', 'pdx-lcd lb-note trn-none', 'No trainers yet. Swap codes with a friend!'));
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
    const list = friendsOf(getSave(), me);
    const got = await Promise.all(list.map(uid => s.F.getDoc(s.F.doc(s.db, TRAINERS, uid)).then(d => (d.exists() ? d.data() : null), () => undefined)));
    if (panel !== at) return;
    state = list.length && got.every(d => d === undefined) ? 'offline' : 'ready';
    docs = new Map(list.map((uid, i) => [uid, readDoc(got[i])]).filter(([, d]) => d));
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
  if (!cloudConfigured()) return;
  onCloudSignIn(() => { publishTrainer(); });
}
