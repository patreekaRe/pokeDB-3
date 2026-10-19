/* ============================================================
   data/trainers.js  -  the Trainers app's pure part (docs/roadmap.md's "Friends list and base visits", session 1):
   friend codes, the list kept in the save, and the public trainer doc as firestore.rules takes it. The network side
   is js/trainers.js.

   trainers/<uid> = { code, name, card, buddy, base, at }: anyone signed in reads it, only its owner writes it.
   codes/<CODE>   = { uid }: made once, create-only, so a clash just rolls another.
   save.friends   = [uid, ...]: one way, no requests; the cloud save carries it to every device.
   plaza/<uid>    = a blurb { name, buddy, partner, tier, badges, wins, at }: the Trainer Plaza, trainers on lately.
   adds/<to>_<from> = the blurb of who added you, with { from, to, seen }: the "added you" pop-up, once each.
   ============================================================ */

import { NAME_MAX, cleanName } from './leaderboard.js';

/** No look-alikes: no O (0), no I or L (1). */
export const CODE_LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ';
export const CODE_LEN = 8;
export const FRIENDS_MAX = 50;
/** The Secret Base rides along as JSON for session 2's visits; past this it's left out (Firestore's doc limit is 1 MiB). */
export const BASE_MAX = 600000;
export const TRAINERS = 'trainers';
export const CODES = 'codes';
export const PLAZA = 'plaza';
export const ADDS = 'adds';
/** Trainers the Plaza shows: the ones on most lately. */
export const PLAZA_SHOWN = 30;

export const TRAINER_KEYS = ['code', 'name', 'card', 'buddy', 'base', 'at'];
export const CARD_KEYS = ['tier', 'badges', 'wins', 'dex', 'dexOf', 'safari', 'safariOf', 'stars', 'time', 'partner', 'rank', 'top', 'fave', 'pillar', 'shinies', 'ranger',
  'gyms', 'gymsOf', 'streak', 'ken', 'belt', 'summits', 'starters', 'startersOf', 'defeated', 'sdays', 'earned', 'fame', 'best', 'sparkle', 'pin', 'rare', 'hof'];
/** The newest keys (2026-10-18); rules published before them refuse them, so a page is written again without (publishTrainer()). */
export const NEW_CARD_KEYS = CARD_KEYS.slice(CARD_KEYS.indexOf('shinies'));
/** The newest Hall of Fame win rides along as JSON: { s starter, g stage, sh shiny, f its Hall of Fame number, d date, k deck }. */
export const HOF_LEN = 1500;
const TIERS = ['green', 'bronze', 'silver', 'gold', 'violet'];
const KEY_MAX = 64;
const BADGES_MAX = 100;

/** A new code; the roll is cosmetic, so Math.random (not js/rng.js). */
export const rollCode = (rand = Math.random) => Array.from({ length: CODE_LEN }, () => CODE_LETTERS[Math.floor(rand() * CODE_LETTERS.length)]).join('');

export const isCode = (code) => typeof code === 'string' && code.length === CODE_LEN && [...code].every(c => CODE_LETTERS.includes(c));

/** ABCD-EFGH, as it's shown and read out. */
export const formatCode = (code) => (isCode(code) ? `${code.slice(0, 4)}-${code.slice(4)}` : '');

/** What was typed, as a code: any case, spaces and dashes ignored. null if it can't be one. */
export function parseCode(text) {
  const code = String(text ?? '').toUpperCase().replace(/[\s\-_.]/g, '');
  return isCode(code) ? code : null;
}

/** The save's list, cleaned: strings only, no repeats, never yourself, at most FRIENDS_MAX. */
export const friendsOf = (save, me = null) =>
  [...new Set((Array.isArray(save?.friends) ? save.friends : []).filter(u => typeof u === 'string' && u && u !== me))].slice(0, FRIENDS_MAX);

/** Adds `uid` to the list: { list, why } where why is null (added), 'self', 'already', 'full' or 'bad'. */
export function addFriend(list, uid, me) {
  if (typeof uid !== 'string' || !uid || uid.length > 128) return { list, why: 'bad' };
  if (uid === me) return { list, why: 'self' };
  if (list.includes(uid)) return { list, why: 'already' };
  if (list.length >= FRIENDS_MAX) return { list, why: 'full' };
  return { list: [...list, uid], why: null };
}

export const dropFriend = (list, uid) => list.filter(u => u !== uid);

const count = (n, hi = 1e7) => Math.max(0, Math.min(hi, Math.round(Number(n) || 0)));
const key = (k) => (typeof k === 'string' ? k.slice(0, KEY_MAX) : '');
/** -1 for "none", as a page from before the key was added reads. */
const orNone = (n, hi) => (Number.isFinite(Number(n)) && n !== null && n !== '' && Number(n) >= 0 ? Math.min(hi, Math.round(Number(n))) : -1);

/** The Trainer Card's numbers as the doc keeps them. */
export function cardDoc(c = {}) {
  return {
    tier: TIERS.includes(c.tier) ? c.tier : 'green',
    badges: (Array.isArray(c.badges) ? c.badges : []).filter(b => typeof b === 'string').map(b => b.slice(0, 32)).slice(-BADGES_MAX),
    wins: count(c.wins), dex: count(c.dex, 9999), dexOf: count(c.dexOf, 9999),
    safari: count(c.safari, 9999), safariOf: count(c.safariOf, 9999),
    stars: count(c.stars, 99), time: count(c.time), partner: key(c.partner),
    rank: orNone(c.rank, 20), top: orNone(c.top, 20), fave: key(c.fave), pillar: count(c.pillar, 999),
    shinies: count(c.shinies, 9999), ranger: orNone(c.ranger, 20),
    gyms: count(c.gyms, 99), gymsOf: count(c.gymsOf, 99), streak: count(c.streak, 9999), ken: count(c.ken, 9999), belt: count(c.belt, 9),
    summits: count(c.summits, 9999), starters: count(c.starters, 999), startersOf: count(c.startersOf, 999),
    defeated: count(c.defeated), sdays: count(c.sdays, 99999), earned: count(c.earned, 1e9), fame: count(c.fame, 9999),
    best: key(c.best), sparkle: count(c.sparkle, 5), pin: key(c.pin).slice(0, 32), rare: key(c.rare),
    hof: typeof c.hof === 'string' && c.hof.length <= HOF_LEN ? c.hof : '',
  };
}

/** A Hall of Fame win as the page carries it (the newest only), cards dropped off the deck's end to fit HOF_LEN. */
export function hofDoc(w) {
  if (!w || typeof w.starter !== 'string') return '';
  const entry = { s: key(w.starter), g: count(w.stage, 9), sh: !!w.shiny, f: count(w.fame, 9999), d: String(w.date || '').slice(0, 10),
    k: (Array.isArray(w.deck) ? w.deck : []).filter(id => typeof id === 'string').map(id => id.slice(0, 40)).slice(0, 80) };
  let json = JSON.stringify(entry);
  while (json.length > HOF_LEN && entry.k.length) { entry.k.pop(); json = JSON.stringify(entry); }
  return json.length <= HOF_LEN ? json : '';
}

/** Someone's Hall of Fame win off their page, untrusted: { starter, stage, shiny, fame, date, deck }, keeping only the
    ids `knownStarter` / `knownCard` accept; null if it isn't one. */
export function readHof(json, knownStarter = () => true, knownCard = () => true) {
  try {
    const e = typeof json === 'string' && json && json.length <= HOF_LEN ? JSON.parse(json) : null;
    if (!e || typeof e.s !== 'string' || !knownStarter(e.s)) return null;
    return { starter: e.s, stage: count(e.g, 9), shiny: e.sh === true, fame: count(e.f, 9999), date: /^\d{4}-\d\d-\d\d$/.test(e.d) ? e.d : '',
      deck: (Array.isArray(e.k) ? e.k : []).filter(id => typeof id === 'string' && knownCard(id)).slice(0, 80) };
  } catch (err) { return null; }
}

/** The doc a trainer writes (`at` is the server's time, added as it's sent). */
export function trainerDoc({ code, name, card, buddy, base }) {
  const doc = { code, name: cleanName(name).toUpperCase() || 'TRAINER', card: cardDoc(card), buddy: key(buddy) };
  const json = base ? JSON.stringify(base) : '';
  if (json && json.length <= BASE_MAX) doc.base = json;
  return doc;
}

/** What firestore.rules would refuse in a trainer doc (without `at`), or null. */
export function checkTrainer(d) {
  if (!d || typeof d !== 'object') return 'not a doc';
  const keys = Object.keys(d);
  if (keys.some(k => !TRAINER_KEYS.includes(k))) return 'extra key';
  if (!isCode(d.code)) return 'bad code';
  if (typeof d.name !== 'string' || !d.name || [...d.name].length > NAME_MAX) return 'bad name';
  if (!d.card || typeof d.card !== 'object' || Object.keys(d.card).some(k => !CARD_KEYS.includes(k))) return 'bad card';
  if (!Array.isArray(d.card.badges) || d.card.badges.length > BADGES_MAX) return 'bad badges';
  if (typeof d.buddy !== 'string' || d.buddy.length > KEY_MAX) return 'bad buddy';
  if ('base' in d && (typeof d.base !== 'string' || d.base.length > BASE_MAX)) return 'bad base';
  return null;
}

/** "Seen 3 h ago" from a doc's time (ms). */
export function lastSeen(ms, now = Date.now()) {
  if (!ms) return 'Not seen yet';
  const min = Math.max(0, Math.round((now - ms) / 60000));
  if (min < 5) return 'Online just now';
  if (min < 60) return `Seen ${min} min ago`;
  if (min < 48 * 60) return `Seen ${Math.round(min / 60)} h ago`;
  return `Seen ${Math.round(min / 1440)} days ago`;
}

export const BLURB_KEYS = ['name', 'buddy', 'partner', 'tier', 'badges', 'wins'];
export const PLAZA_KEYS = [...BLURB_KEYS, 'at'];
export const ADD_KEYS = ['from', 'to', ...BLURB_KEYS, 'seen', 'at'];

/** A trainer in a line: what the Plaza and the "added you" pop-up show. */
export const blurbDoc = ({ name, buddy, partner, tier, badges, wins } = {}) => ({
  name: cleanName(name).toUpperCase() || 'TRAINER', buddy: key(buddy), partner: key(partner),
  tier: TIERS.includes(tier) ? tier : 'green', badges: count(badges, 999), wins: count(wins),
});

export const addId = (to, from) => `${to}_${from}`;
/** The note `from` leaves for `to` on adding them (`at` added as it's sent). */
export const addDoc = (from, to, blurb) => ({ from, to, ...blurbDoc(blurb), seen: false });

/** The Plaza's trainers, on most lately first: never you, each once, at most PLAZA_SHOWN. `at` in ms. */
export function plazaPick(entries, me) {
  const seen = new Set([me]);
  return [...entries].sort((a, b) => (b.at || 0) - (a.at || 0)).filter(e => e?.uid && !seen.has(e.uid) && seen.add(e.uid)).slice(0, PLAZA_SHOWN);
}
