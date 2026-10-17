/* ============================================================
   mail.js  -  the Clearing's PC's mailbox (2026-10-09, the user's ask: rewards opened at the PC with a little moment,
   not popped up mid-run). A big PokéCoin prize (a Pokédex or Safari page done, the whole Pokédex, a first Level 5 win
   with a type, a feat's coins) is posted as a letter in `save.mail`; the PC's Mailbox opens it and pays it (js/pc.js).
   With the old sign title (Settings' Title screen: Signs) there is no PC to walk to, so it's paid at once as before.
   Since 2026-10-15 (docs/roadmap.md step 8, session e) friends write too: a letter may hold a material (`mat`) instead of
   coins, or show a secret recipe they taught Kurt (`recipe`, nothing to claim but the reading).
   ============================================================ */

import { getSave, updateSave, awardCoins, coinsWithBonus } from './storage.js';
import { pref } from './prefs.js';
import { GYM_BY_ID, GYM_INK } from './data/gym.js';
import { workshopOf, heartsOf, friendLetter } from './data/workshop.js';
import { satchelOf, addMat, biomeMats, MATERIALS_BY_ID } from './data/satchel.js';
import { safariDay } from './data/safari.js';
import { townsOpen } from './data/towns.js';

/** Who a letter is from: its name on the envelope and its stamp's colours. */
export const SENDERS = {
  lab: { name: 'POKéDEX LAB', ink: '#d84a3a', paper: '#fff4e6' },
  safari: { name: 'SAFARI ZONE', ink: '#3f8f3a', paper: '#f2f8e4' },
  league: { name: 'POKéMON LEAGUE', ink: '#2f5fb8', paper: '#eef3ff' },
  depths: { name: 'CRYSTAL DEPTHS', ink: '#7a3fc0', paper: '#f4eeff' },
  trainers: { name: 'TRAINER NETWORK', ink: '#1f8a9a', paper: '#eaf8fa' },
};

/** A letter's sender: one of SENDERS, or a friend (a Gym Leader's id) in their own ink. */
export function senderOf(from) {
  if (SENDERS[from]) return SENDERS[from];
  const l = GYM_BY_ID[from];
  return l ? { name: l.name, ink: GYM_INK[from]?.[1] ?? '#3a78b8', paper: '#fff8f0', friend: true } : SENDERS.lab;
}

const KEEP = 30;   // opened letters kept to read again; the oldest go first

/** Is there a PC to collect from? The Clearing is the title (js/title.js's useHub(), read here without its imports). */
export const mailOn = () => pref('titleHub') && !new URLSearchParams(location.search).has('signs');

/** Post a reward (`extra`: a `mat` { id, n } or a `recipe` id). Returns how to say it in a line: paid now, or that it
    waits in the PC. */
export function post(from, title, text, coins, extra = {}) {
  if (!mailOn()) {
    if (extra.mat) updateSave(d => { d.satchel = addMat(satchelOf(d, false), extra.mat.id, extra.mat.n); });
    return coins ? `+${awardCoins(coins)} PokéCoins.` : '';
  }
  updateSave(d => {
    d.mail = [...(d.mail || []), { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, from, title, text, coins, ...extra, at: Date.now() }];
    const open = d.mail.filter(m => m.claimed);
    if (open.length > KEEP) { const gone = new Set(open.slice(0, open.length - KEEP).map(m => m.id)); d.mail = d.mail.filter(m => !gone.has(m.id)); }
  });
  return `📬 ${coinsWithBonus(coins)} PokéCoins are waiting in your PC's mailbox.`;
}

/** The first time a signed-in player logs on to the PC: one letter with their trainer code, and how the Trainers app
    works (docs/roadmap.md's "Friends list and base visits"). Nothing to claim but the reading. */
export function trainersLetter(code) {
  if (!code || getSave().trainersLetter) return;
  updateSave(d => { d.trainersLetter = true; });
  post('trainers', 'Your trainer code', 'You\'re on the Trainer Network! Give a friend your code and they can add you in the Trainers app on your Pokédex. Meet more trainers in its Trainer Plaza, or tap a name on any leaderboard. When someone adds you, you'll get a TRAINER LINK.', 0, { code });
}

/** Letters not yet claimed. */
export const unclaimed = (save = getSave()) => (save.mail || []).filter(m => !m.claimed);

/** Open a letter and pay it: its material into the Satchel, its coins. Returns the PokéCoins paid (0 if it was already
    claimed or held none). */
export function claim(id) {
  const m = (getSave().mail || []).find(x => x.id === id);
  if (!m || m.claimed) return 0;
  updateSave(d => {
    const x = d.mail.find(y => y.id === id);
    if (x) x.claimed = Date.now();
    if (m.mat && MATERIALS_BY_ID[m.mat.id]) d.satchel = addMat(satchelOf(d, false), m.mat.id, m.mat.n);
  });
  return m.coins ? awardCoins(m.coins) : 0;
}

/** Once a UTC day, coming home: maybe a letter from a friend (js/data/workshop.js's friendLetter()). True if one came. */
export function friendMail() {
  const save = getSave(), day = safariDay();
  if (!mailOn() || !townsOpen() || save.friendMail === day) return false;
  const ws = workshopOf(save);
  const l = friendLetter((id) => heartsOf(ws, id), Math.random, (id) => GYM_BY_ID[id]?.biome, (b) => biomeMats(b, true));
  updateSave(d => { d.friendMail = day; });
  if (!l) return false;
  post(l.from, l.title, l.text, l.coins || 0, l.mat ? { mat: l.mat } : {});
  return true;
}

/** `?mail` drops five sample letters (two from friends) for a playtest into an empty mailbox (saved like real ones, so they can be claimed;
    only once, so a bookmarked link isn't a coin tap). */
export function sampleMail() {
  if (!mailOn() || (getSave().mail || []).length) return;
  post('lab', 'Page complete!', 'Congratulations on completing the Whispering Clearing page of your Pokédex! Please accept this reward for your research.', 300);
  post('safari', 'A full page!', 'Every Pokémon of the Meadow is in your Safari Pokédex. The rangers send their thanks.', 1000);
  post('league', 'Jackpot!', 'Your first Trainer Level 5 win with a Fire Pokémon! The League rewards a true champion.', 500);
  post('kayl', 'From Spooky and Reya', 'They knocked this off the shelf, so it\'s yours now. - Kayl', 0, { mat: { id: 'driftwood', n: 2 } });
  post('john', 'My secret recipe', 'I showed Kurt how I make my Repeat Ball. Go see him at the Workshop! - John', 0, { recipe: 'skin-repeat' });
}
