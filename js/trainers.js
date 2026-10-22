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
  trainerDoc, checkTrainer, lastSeen, cardDoc, blurbDoc, addId, addDoc, plazaPick, hofDoc, readHof, FRIENDS_MAX, BASE_MAX, NEW_CARD_KEYS, NEWEST_CARD_KEYS } from './data/trainers.js';
import { cloudConfigured, cloudRemembered, cloudSession, onCloudSignIn, openCloud } from './cloud.js';
import { getSave, updateSave } from './storage.js';
import { starClass } from './data/difficulty.js';
import { pref } from './prefs.js';
import { trainerName } from './leaderboard.js';
import { partnerKey, buddyKey, cardTier, badgeArt, shinyTotal, pinnable, TIERS as CARD_TIERS } from './trainercard.js';
import { BADGES, BADGES_BY_ID, safariDays } from './data/badges.js';
import { GYM_LEADERS, gymWins } from './data/gym.js';
import { BELTS, beltOf, kenWinsOf } from './data/dojo.js';
import { SAFARI_ROSTER, SAFARI_NUMBER, safariHomes } from './data/safari.js';
import { CARDS_BY_ID } from './data/cards.js';
import { sparkleOf } from './data/shinies.js';
import { journalRank } from './data/journal.js';
import { JOURNAL_RANKS } from './data/journal-ranks.js';
import { dexTally, safariOpen } from './data/pokedex.js';
import { safariDexCount } from './safaridex.js';
import { rankOf, RANKS as RANGER_RANKS } from './data/ranger.js';
import { STARTERS, STARTERS_BY_ID, spriteUrl } from './data/starters.js';
import { ENEMY_DEFS } from './data/enemies.js';
import { shinyImage } from './data/shinies.js';
import { isStarterUnlocked } from './progress.js';
import { shelfApp, typed } from './bagdex.js';
import { playCry, playSound } from './audio.js';
import { $, el, fitText } from './ui.js';
import { showTrainerNotices, showTrainerWelcome, noticeOpen } from './trainer-notice.js';

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

/** A friend's stars, the ⭐ tinted by the top Level they have won (gold at 5, a rainbow at 10). */
const starsOf = (c) => { const b = el('b', ''); b.append(el('span', starClass(c.top), '⭐'), `${c.stars}`); return b; };

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
    rank: journalRank(save).level - 1, top: Math.max(-1, ...Object.values(save.stats.maxLevelWinByType || {})),
    fave: faveStarter(save.stats.winsBy), pillar: save.tower?.bestEver || 0,
    shinies: safari ? shinyTotal(save) : 0, ranger: safari ? rankOf(save).level - 1 : -1,
    gyms: GYM_LEADERS.filter(l => gymWins(save, l.id) > 0).length, gymsOf: GYM_LEADERS.length,
    streak: save.stats.bestStreak || 0, ken: kenWinsOf(save), belt: beltOf(save), summits: save.tower?.summits || 0,
    starters: OPEN_STARTERS.filter(isStarterUnlocked).length, startersOf: OPEN_STARTERS.length,
    defeated: save.stats.enemiesDefeated || 0, sdays: safari ? safariDays(save) : 0, earned: save.stats.coinsEarned || 0,
    fame: fameWins(save).length, best: safari ? bestShiny(save) : '', sparkle: safari ? sparkleOf(save.safariShinies, bestShiny(save)) : 0,
    pin: pinnable(save.pinBadge, save) ? save.pinBadge : '', rare: safari ? rarestCatch(save) : '', hof: hofDoc(fameWins(save).at(-1)),
    shell: pref('shell'),
  };
}

/** Starters a page counts: Mewtwo stays off it. */
const OPEN_STARTERS = STARTERS.filter(s => !s.secret);
/** The Hall of Fame proper: Level 5 wins, Mewtwo's Depths runs aside. */
const fameWins = (save) => (save.hallOfFame || []).filter(w => w.fame && w.starter !== 'mewtwo');

/** How rare a Safari Pokémon is: a rare spawn first, then the fewer pages it lives on, then the later in the Safari Pokédex. */
const rarity = (id) => { const homes = safariHomes(id); return (homes.some(h => h.rare) ? 1e6 : 0) - homes.length * 1e3 + (SAFARI_NUMBER[id] || 0); };
const rarest = (ids) => [...ids].sort((a, b) => rarity(b) - rarity(a))[0] ?? '';
/** The shiny with the most Sparkle (the rarer on a tie). */
const bestShiny = (save) => { const top = Math.max(0, ...SAFARI_ROSTER.map(id => sparkleOf(save.safariShinies, id))); return top ? rarest(SAFARI_ROSTER.filter(id => sparkleOf(save.safariShinies, id) === top)) : ''; };
const rarestCatch = (save) => rarest((save.safariDex?.caught || []).filter(id => SAFARI_NUMBER[id]));

/** The starter with the most wins ('' before any). */
const faveStarter = (winsBy = {}) => Object.entries(winsBy).filter(([id, n]) => n > 0 && STARTERS_BY_ID[id]).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';

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
      const page = s.F.doc(s.db, TRAINERS, s.user.uid);
      // rules published before the card's newer numbers refuse them: the page still goes up without, the newest off first
      for (const off of [[], NEWEST_CARD_KEYS, NEW_CARD_KEYS]) {
        const card = Object.fromEntries(Object.entries(doc.card).filter(([k]) => !off.includes(k)));
        try { await s.F.setDoc(page, { ...doc, card, at: s.F.serverTimestamp() }); break; }
        catch (err) { if (err?.code !== 'permission-denied' || off === NEW_CARD_KEYS) throw err; }
      }
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
    const shiny = a === 'shiny' && met;   // a Safari shiny partner (2026-10-19)
    return { src: shiny ? shinyImage(id) : ENEMY_DEFS[id].image, name: met ? `${shiny ? 'Shiny ' : ''}${ENEMY_DEFS[id].name}` : '???', masked: !met, cry: ENEMY_DEFS[id].spriteId ?? id };
  }
  const st = kind === 'starter' && STARTERS_BY_ID[id];
  if (!st) return { src: spriteUrl(STARTERS_BY_ID.charmander, 'front', 0), name: 'Charmander', cry: 'charmander' };
  const stage = /^\d$/.test(a ?? '') ? Math.min(+a, st.line.length - 1) : 0, shiny = a === 'shiny' || b === 'shiny';
  const masked = st.secret && !isStarterUnlocked(st);
  return { src: spriteUrl(st, 'front', stage, shiny), name: masked ? '???' : `${shiny ? 'Shiny ' : ''}${st.line[stage].name}`, masked, cry: st.line[stage].id };
}

/** A trainer's buddy or partner key as { src, name, masked, cry } (friends' graves and the Plaza's buddies, js/graves.js). */
export const trainerMon = (key) => sprite(key);

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
    base: typeof d.base === 'string' && d.base.length <= BASE_MAX ? d.base : '', yard: hasYard(d.base) };
}

/** Whether a page's base has a bought backyard: it's reached through the garden arch, not the house, so Visit asks which. */
function hasYard(json) {
  try { const y = typeof json === 'string' && json.length <= BASE_MAX && JSON.parse(json)?.house?.yard; return !!y && !y.lent; } catch { return false; }
}

/* Visit: main.js hands over the way into a friend's base (openBase3d({ guest }) in js/base-3d.js), so this file never
   loads the furniture to draw the app. It resolves false if their base couldn't be read, 'run' during a run. */
let visitor = null;
export const onVisit = (fn) => { visitor = fn; };

const atOf = (doc) => (typeof doc?.at?.toMillis === 'function' ? doc.at.toMillis() : +doc?.at || 0);
const playTime = (min) => `${Math.floor(min / 60)}h ${min % 60}m`;
const BADGES_SHOWN = 7;
const EARNABLE = BADGES.filter(b => !b.locked).length;

/** The card's numbers, three across: two rows show and the rest scroll up (the user's call, 2026-10-18, so more can join
    without the page growing); each says what it is when tapped (js/tips.js reads the title). */
function cardGrid(c, name) {
  const box = el('div', 'pdx-lcd trn-grid');
  const cell = (k, v, tip) => { const f = el('span', 'trn-cell'); f.title = tip; f.append(el('small', '', k), v); return f; };
  const wins = el('b', '', `${c.wins}`);
  const rank = c.ranger >= 0 ? RANGER_RANKS[Math.min(c.ranger, RANGER_RANKS.length - 1)].name : '';
  const ranger = el('b', '', rank ? rank.replace(/^(\S+) Ranger$/, '$1') : '-');   // under its "Ranger" label: "Senior", not "Senior Ranger"
  const fave = c.fave && STARTERS_BY_ID[c.fave] ? sprite(`starter:${c.fave}`) : null;
  const defeated = el('b', '', c.defeated ? c.defeated.toLocaleString('en') : '-'), earned = el('b', '', c.earned ? c.earned.toLocaleString('en') : '-');
  const fame = c.fame ? `${c.fame} Level 5 win${c.fame === 1 ? '' : 's'} with ${c.stars} starter${c.stars === 1 ? '' : 's'}, in the Hall of Fame. ` : '';
  box.append(
    cell('Wins', wins, `Runs ${name} has won, at any Trainer Level, in ${playTime(c.time)} of play.`),
    cell('Dex', el('b', '', `${c.dex}/${c.dexOf}`), `Pokémon ${name} has beaten, on every Pokédex page they have found.`),
    cell('Stars', c.stars ? starsOf(c) : el('b', '', '-'), `${fame}A star for each starter ${name} has won a Level 5 run with, its colour the highest Level they have won: gold at 5, a rainbow at 10.`),
    cell('Top Lv', el('b', '', c.top >= 0 ? `Lv ${c.top}` : '-'), c.top >= 0 ? `The highest Trainer Level ${name} has won a run on.` : `The highest Trainer Level ${name} has won a run on. None yet.`),
    cell('Fave', fave ? monImg(`starter:${c.fave}`, 'trn-fave') : el('b', '', '-'), fave ? `${name}'s favourite: ${fave.name}, the starter they have won the most runs with.` : `The starter ${name} has won the most runs with. None yet.`),
    cell('Pillar', el('b', '', c.pillar ? `${c.pillar}F` : '-'), c.pillar ? `The highest Sky Pillar floor ${name} has reached.` : `The highest Sky Pillar floor ${name} has reached. Not climbed yet.`),
    cell('Safari', el('b', '', c.safariOf ? `${c.safari}/${c.safariOf}` : '-'), c.safariOf ? `Pokémon ${name} has caught in the Safari Zone.` : `Pokémon ${name} has caught in the Safari Zone. Not open for them yet.`),
    cell('Shinies', el('b', '', c.shinies ? `✨${c.shinies}` : '-'), `Safari Pokémon whose shiny ${name} owns, caught in the wild or pulled at the Shiny Exchange.`),
    cell('Ranger', ranger, rank ? `${name} is a ${rank}, from tasks claimed on the Safari Outfitter's Ranger Task Board.` : `${name}'s Ranger Rank, once the Safari Zone opens for them.`),
    cell('Gyms', el('b', '', c.gymsOf ? `${c.gyms}/${c.gymsOf}` : '-'), `Gym Leaders ${name} has beaten at least once.`),
    cell('Streak', el('b', '', c.streak ? `🔥${c.streak}` : '-'), `The most runs ${name} has won in a row, on Trainer Level 2 or higher.`),
    cell('Kenmatta', el('b', '', c.belt ? BELTS[Math.min(c.belt, BELTS.length - 1)].name.replace(/ Belt$/, '') : c.ken ? `${c.ken} win${c.ken === 1 ? '' : 's'}` : '-'),
      c.belt ? `${name} holds Chad Master Kenmatta's ${BELTS[Math.min(c.belt, BELTS.length - 1)].name}, and has beaten him ${c.ken} time${c.ken === 1 ? '' : 's'} in runs.` : `Times ${name} has beaten Chad Master Kenmatta in runs. His dojo's stars and wins earn belts.`),
    cell('Summits', el('b', '', c.summits ? `☁️${c.summits}` : '-'), `Climbs ${name} has taken all the way to the top of the Sky Pillar.`),
    cell('Starters', el('b', '', c.startersOf ? `${c.starters}/${c.startersOf}` : '-'), `Starters ${name} has unlocked.`),
    cell('Defeated', defeated, `Wild Pokémon, Alphas and bosses ${name} has knocked out in all.`),
    cell('Safari days', el('b', '', c.sdays ? `${c.sdays}` : '-'), `Different days ${name} has played the Safari Zone.`),
    cell('Coins', earned, `PokéCoins ${name} has earned in all, spent or not.`));
  fitText(wins);
  fitText(defeated);
  fitText(earned);
  return box;
}

/** Shown off on the page: their best shiny with its Sparkle, their rarest Safari catch and their newest Hall of Fame win,
    whose deck a tap lays out. Only those they have; null when none. */
function showcase(c, name) {
  const tiles = [];
  const tile = (label, img, under, tip, tag = 'span') => {
    const t = el(tag, 'trn-show-tile');
    if (tip) t.title = tip;
    t.append(el('small', '', label), img, el('b', '', under));
    tiles.push(t);
    return t;
  };
  if (c.best && SAFARI_NUMBER[c.best]) {
    const m = sprite(`mon:${c.best}:shiny`);
    tile('Best shiny', monImg(`mon:${c.best}:shiny`, 'trn-show-mon'), '★'.repeat(Math.max(1, c.sparkle)),
      m.masked ? `${name}'s brightest shiny, a Pokémon you haven't met yet.` : `${name}'s brightest shiny: ${m.name}, at Sparkle ★${Math.max(1, c.sparkle)}.`);
  }
  if (c.rare && SAFARI_NUMBER[c.rare]) {
    const m = sprite(`mon:${c.rare}`);
    tile('Rarest catch', monImg(`mon:${c.rare}`, 'trn-show-mon'), m.masked ? '???' : m.name,
      m.masked ? `The rarest Pokémon ${name} has caught in the Safari Zone. You haven't met it yet.` : `The rarest Pokémon ${name} has caught in the Safari Zone: ${m.name}.`);
  }
  const hof = readHof(c.hof, id => STARTERS_BY_ID[id] && !STARTERS_BY_ID[id].secret, id => { const card = CARDS_BY_ID[id.replace(/\+$/, '')]; return !!card && card.type !== 'psychic'; });
  let deck = null;
  if (hof) {
    const key = `starter:${hof.starter}:${hof.stage}${hof.shiny ? ':shiny' : ''}`, m = sprite(key);
    const t = tile('Hall of Fame', monImg(key, 'trn-show-mon'), hof.fame ? `No.${hof.fame}` : m.name, '', 'button');
    t.type = 'button';
    t.setAttribute('aria-label', `${name}'s newest Hall of Fame win, ${m.name}. Show its deck`);
    t.setAttribute('aria-expanded', 'false');
    t.addEventListener('click', () => {
      const open = !deck.hidden;
      deck.hidden = open;
      t.setAttribute('aria-expanded', String(!open));
      t.classList.toggle('on', !open);
      playSound(open ? 'cancel' : 'confirm');
    });
    deck = el('div', 'trn-show-deck');
    deck.hidden = true;
    const counts = new Map();
    for (const id of hof.deck) counts.set(id, (counts.get(id) || 0) + 1);
    const list = el('ul', '');
    for (const [id, n] of counts) list.append(el('li', '', `${CARDS_BY_ID[id.replace(/\+$/, '')].name}${id.endsWith('+') ? '+' : ''}${n > 1 ? ` ×${n}` : ''}`));
    deck.append(el('p', '', `${m.name}${hof.fame ? `, Hall of Fame No.${hof.fame}` : ''}${hof.date ? ` (${hof.date})` : ''}: ${hof.deck.length} cards.`), list);
  }
  if (!tiles.length) return null;
  const box = el('div', 'pdx-lcd trn-show');
  const row = el('div', 'trn-show-row');
  row.append(...tiles);
  box.append(row, ...(deck ? [deck] : []));
  return box;
}

/** The badge they pinned on their own Trainer Card, by the partner on their page's screen. */
function pinnedBadge(c, name) {
  const b = BADGES_BY_ID[c.pin];
  if (!b || b.locked || b.secret) return null;
  const img = el('img', 'trn-pin');
  img.src = badgeArt(b.id, true);
  img.alt = b.name;
  img.title = `${name}'s pinned badge: ${b.name}. ${b.text}.`;
  return img;
}

function badgeRow(c, name) {
  const ids = c.badges.filter(id => BADGES_BY_ID[id] && !BADGES_BY_ID[id].locked);
  const box = el('div', 'pdx-lcd trn-badges');
  const head = el('div', 'trn-badges-head'), title = el('b', '', 'Badges');
  title.title = `${name} has earned ${ids.length} of the game's ${EARNABLE} badges. The row shows their newest.`;
  head.append(title, el('span', '', `${ids.length}/${EARNABLE}`));
  const row = el('span', 'trn-badge-row');
  for (const id of ids.slice(-BADGES_SHOWN)) {
    const b = BADGES_BY_ID[id], img = el('img', '');
    img.src = badgeArt(id, true);
    img.alt = b.name;
    img.title = `${b.name}: ${b.text}.`;
    row.append(img);
  }
  if (ids.length > BADGES_SHOWN) {
    const more = el('span', 'trn-more', `+${ids.length - BADGES_SHOWN}`);
    more.title = `${ids.length - BADGES_SHOWN} more of ${name}'s badges.`;
    row.append(more);
  }
  box.append(head, ids.length ? row : el('small', '', 'None yet'));
  return box;
}

/** "3 h ago" for the nameplate's corner. */
const seenShort = (ms) => { const t = lastSeen(ms); return t === 'Online just now' ? 'Online' : t === 'Not seen yet' ? '-' : t.replace(/^Seen /, ''); };

/* ---------- the Trainer Plaza: the app's banner, and the board in the Clearing (plazaBoard() in js/hub-plaza.js) ---------- */

const fetchPlaza = (s) => s.F.getDocs(s.F.query(s.F.collection(s.db, PLAZA), s.F.orderBy('at', 'desc'), s.F.limit(PLAZA_SHOWN + 1)))
  .then(q => q.docs.map(d => ({ ...blurbDoc(d.data()), uid: d.id, at: atOf(d.data()) })));

let plazaCache = null;
/** The Clearing's board: up to `n` trainers on lately, you among them, each with `mon` and `mine`; null signed out or
    offline. Fetched at most once a minute. */
export async function plazaTop(n = 6) {
  if (!cloudConfigured() || !cloudRemembered()) return null;
  try {
    const s = await cloudSession();
    if (!s.user) return null;
    if (!plazaCache || Date.now() - plazaCache.at > 60000) plazaCache = { at: Date.now(), list: await fetchPlaza(s) };
    return plazaPick(plazaCache.list, null).slice(0, n).map(e => ({ ...e, mon: sprite(e.buddy || e.partner), mine: e.uid === s.user.uid }));
  } catch (err) { return null; }
}

/* ---------- the welcome: the first time the app opens signed in, and its ? key ---------- */

const WELCOME = [
  'Welcome to the Trainer Network! This is your code. Give it to a friend to add you.',
  'Trainers you add get a banner here. Tap one to see their Trainer Card.',
  'The Trainer Plaza shows who\'s played lately. Tap + Add to add one!',
  'Its board stands at the top of the Clearing\'s plaza. Hide me keeps you off it.',
  'Someone added you? A TRAINER LINK pops up. Add them back to link up!',
  'Tap Visit on a trainer\'s page to walk round their Secret Base, just as they left it!',
  'Lose a run and your trainers find your grave on their map where you fell. Leave flowers on theirs, or avenge them!',
];

function welcome(code, done) {
  const save = getSave();
  showTrainerWelcome({ tier: cardTier(save).id, code: formatCode(code) || '????-????', mon: sprite(buddyKey(save)) }, WELCOME, () => {
    if (!getSave().trainersWelcome) updateSave(d => { d.trainersWelcome = true; });
    done?.();
  });
}

/* ---------- the TRAINER LINK pop-up: each note not answered yet, once you're somewhere calm ---------- */

const RUN_SCREENS = ['map-screen', 'battle-screen', 'reward-screen'];
const calmNow = () => !noticeOpen() && !document.querySelector('dialog[open], .pc-screen') && !RUN_SCREENS.includes(document.body.dataset.screen)
  && $('collection-screen')?.hidden !== false;

function whenCalm(fn, tries = 0) {
  if (calmNow()) return fn();
  if (tries < 400) setTimeout(() => whenCalm(fn, tries + 1), 1500);
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
/** ?mycard: your own page, as a friend sees it, as a banner in the app (made here: nothing fetched or sent). */
const MY_CARD = 'mycard';
const myCardSample = () => new URLSearchParams(location.search).has(MY_CARD);

export function trainersApp() {
  let panel = null, shelf = null, me = null, code = null, docs = new Map(), notes = [], plaza = [], state = 'loading', said = '', removing = null, openAt = null;

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
    const help = el('button', 'lb-btn trn-help', '?');
    help.type = 'button';
    help.setAttribute('aria-label', 'How the Trainer Network works');
    help.addEventListener('click', () => { playSound('confirm'); welcome(code); });
    mine.append(el('small', '', 'Your trainer code'), el('b', 'trn-code-text', code ? formatCode(code) : state === 'loading' ? 'Loading…' : '---'), help);
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
    if (docs.has(MY_CARD)) { const ink = TIER_INK[docs.get(MY_CARD).card.tier]; out.push({ id: MY_CARD, friend: true, name: docs.get(MY_CARD).name, sub: 'You, as a friend sees you', b1: ink[0], b2: ink[1], cls: 'trn-banner', list: () => [MY_CARD] }); }
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
    const keys = el('div', 'trn-keys'), doc = docs.get(uid);
    // a base with a backyard gets two keys, as at home the yard is through the garden arch, not the house
    const visits = (doc?.yard ? [['main', 'Visit house'], ['yard', 'Visit yard']] : [['main', 'Visit']]).map(([start, name]) => {
      const visit = el('button', 'lb-btn trn-visit', name);
      visit.type = 'button';
      visit.dataset.start = start;
      visit.disabled = !doc?.base || !visitor;
      visit.title = doc?.base ? `Walk round ${doc.name}'s ${start === 'yard' ? 'backyard' : 'Secret Base'}` : 'They haven\'t made a Secret Base yet.';
      visit.addEventListener('click', async () => {
        visit.disabled = true;
        playSound('confirm');
        const went = await visitor({ name: doc.name, json: doc.base, start });
        if (went !== false && went !== 'run') return;
        playSound('cancel');
        visit.textContent = went === 'run' ? 'Not mid-run' : 'Can\'t open it';
      });
      return visit;
    });
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
    keys.append(...visits, ...(uid === MY_CARD ? [] : [remove]));
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
      sub(g, uid) {
        const doc = docs.get(uid), at = doc ? atOf(doc) : blurbOf(uid)?.at;
        if (at === undefined) return null;
        const rank = JOURNAL_RANKS[doc?.card.rank], left = el('span', 'pdx-sub', rank?.name ?? ''), right = el('span', 'pdx-sub', seenShort(at));
        if (rank) left.title = `${doc.name}'s Trainer's Journal rank, from tasks claimed at the Clearing's PC.`;
        right.title = `${nameOf(uid)} last played ${lastSeen(at).replace(/^Seen /, '').replace(/^Online /, '')}. Their card updates each time they do.`;
        return [left, right];
      },
      screen(g, uid) {
        const tier = docs.get(uid)?.card?.tier ?? blurbOf(uid)?.tier, mon = monImg(partnerOf(uid), 'pdx-mon bdx-art'), m = sprite(partnerOf(uid));
        if (!m.masked) mon.title = `${nameOf(uid)}'s partner, ${m.name}.`;
        const doc = docs.get(uid), pin = doc && pinnedBadge(doc.card, doc.name);
        const nodes = [el('span', 'pdx-pad'), mon, ...(pin ? [pin] : [])];
        if (tier) {
          const tag = el('span', 'pdx-role trn-role', `${tier[0].toUpperCase()}${tier.slice(1)} card`);
          tag.title = `The card's colour comes from badges: ${CARD_TIERS.map(t => (t.at ? `${t.name} at ${t.at}` : t.name)).join(', ')}. Violet once Eternatus is beaten.`;
          nodes.push(tag);
        }
        return nodes;
      },
      lines(g, uid) {
        const doc = docs.get(uid), b = blurbOf(uid), keys = g.friend ? friendKeys(uid) : addKeys(uid, g.id === 'added');
        const walk = sprite(buddyOf(uid));
        if (doc) return [cardGrid(doc.card, doc.name), ...[showcase(doc.card, doc.name)].filter(Boolean), badgeRow(doc.card, doc.name), typed('', `Walking with ${walk.name}.`), keys,
          ...(g.friend ? [typed('muted', doc.base ? 'Visit walks round their Secret Base as they last left it.' : 'No Secret Base to visit yet.')] : [])];
        if (b) return [typed('', g.id === 'added' ? `${b.name} added you ${lastSeen(b.at).replace(/^Seen |^Online /, '')}.` : `${b.name}. ${lastSeen(b.at)}.`), blurbFacts(b), typed('', `Walking with ${walk.name}.`), keys];
        return [typed('muted', 'They haven\'t been on since Trainers came in.'), typed('muted', 'They\'ll show up here once they play signed in.'), keys];
      },
      tally: (g) => (g.id === 'plaza' ? 'Trainers in the Plaza' : g.id === 'added' ? 'Trainers who added you' : 'Trainer Card'),
      empty: (g) => (g.id === 'plaza' ? 'Nobody\'s here yet. Check back soon!' : ''),
      // their page in their own Pokédex colour; a Plaza blurb doesn't carry it, so that stays yours
      dress(dev, g, uid) { const shell = docs.get(uid)?.card.shell; if (shell) dev.dataset.shellOf = shell; else delete dev.dataset.shellOf; },
      onShow: (g, uid) => { removing = null; const m = sprite(partnerOf(uid)); if (partnerOf(uid) && !m.masked) playCry(m.cry); },
      top: topBox,
    });
  }

  function remount() {
    if (!panel) return;
    shelf?.unmount();
    shelf = build();
    panel.replaceChildren();
    const at = state === 'ready' ? openAt : null;
    if (at) openAt = null;
    shelf.mount(panel, at);
    if (!friendsOf(getSave(), me).length && state === 'ready') panel.querySelector('.pdx-banners')?.append(el('p', 'pdx-lcd lb-note trn-none', 'No trainers on your list yet. Meet some in the Trainer Plaza, or swap codes with a friend!'));
  }

  async function load() {
    const at = panel;
    state = 'loading';
    remount();
    if (myCardSample()) {
      const save = getSave();
      docs = new Map([[MY_CARD, readDoc({ ...trainerDoc({ code: 'AAAAAAAA', name: trainerName(), card: myCard(save), buddy: buddyKey(save), base: save.secretBase }), at: Date.now() })]]);
      state = 'sample';
      remount();
      return;
    }
    if (!cloudConfigured()) return;
    let s;
    try { s = await cloudSession(); } catch (err) { if (panel === at) { state = 'offline'; remount(); } return; }
    if (panel !== at) return;
    if (!s.user) { state = 'signin'; remount(); return; }
    me = s.user.uid;
    code = myCode(me) ?? await publishTrainer();
    const [gotNotes, gotPlaza] = await Promise.all([
      notesFor(s).catch(() => []),
      fetchPlaza(s).catch(() => null),
    ]);
    notes = gotNotes;
    plaza = plazaPick(gotPlaza ?? [], me);
    const want = [...new Set([...friendsOf(getSave(), me), ...adders()])];
    const got = await Promise.all(want.map(uid => s.F.getDoc(s.F.doc(s.db, TRAINERS, uid)).then(d => (d.exists() ? d.data() : null), () => undefined)));
    if (panel !== at) return;
    state = gotPlaza === null && got.every(d => d === undefined) ? 'offline' : 'ready';
    docs = new Map(want.map((uid, i) => [uid, readDoc(got[i])]).filter(([, d]) => d));
    if (gotPlaza) plazaCache = { at: Date.now(), list: gotPlaza };
    remount();
    if (state === 'ready' && !getSave().trainersWelcome) welcome(code);
  }

  return {
    /** `at` 'plaza' opens straight onto the Plaza (the Clearing's board). */
    mount(p, at) { panel = p; said = ''; removing = null; openAt = at ?? null; load(); },
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
