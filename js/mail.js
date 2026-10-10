/* ============================================================
   mail.js  -  the Clearing's PC's mailbox (2026-10-09, the user's ask: rewards opened at the PC with a little moment,
   not popped up mid-run). A big PokéCoin prize (a Pokédex or Safari page done, the whole Pokédex, a first Level 5 win
   with a type, a feat's coins) is posted as a letter in `save.mail`; the PC's Mailbox opens it and pays it (js/pc.js).
   With the old sign title (Settings' Title screen: Signs) there is no PC to walk to, so it's paid at once as before.
   ============================================================ */

import { getSave, updateSave, awardCoins, coinsWithBonus } from './storage.js';
import { pref } from './prefs.js';

/** Who a letter is from: its name on the envelope and its stamp's colours. */
export const SENDERS = {
  lab: { name: 'POKéDEX LAB', ink: '#d84a3a', paper: '#fff4e6' },
  safari: { name: 'SAFARI ZONE', ink: '#3f8f3a', paper: '#f2f8e4' },
  league: { name: 'POKéMON LEAGUE', ink: '#2f5fb8', paper: '#eef3ff' },
  depths: { name: 'CRYSTAL DEPTHS', ink: '#7a3fc0', paper: '#f4eeff' },
};

const KEEP = 30;   // opened letters kept to read again; the oldest go first

/** Is there a PC to collect from? The Clearing is the title (js/title.js's useHub(), read here without its imports). */
export const mailOn = () => pref('titleHub') && !new URLSearchParams(location.search).has('signs');

/** Post a reward. Returns how to say it in a line: "+N PokéCoins." paid now, or that it waits in the PC. */
export function post(from, title, text, coins) {
  if (!mailOn()) return `+${awardCoins(coins)} PokéCoins.`;
  updateSave(d => {
    d.mail = [...(d.mail || []), { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, from, title, text, coins, at: Date.now() }];
    const open = d.mail.filter(m => m.claimed);
    if (open.length > KEEP) { const gone = new Set(open.slice(0, open.length - KEEP).map(m => m.id)); d.mail = d.mail.filter(m => !gone.has(m.id)); }
  });
  return `📬 ${coinsWithBonus(coins)} PokéCoins are waiting in your PC's mailbox.`;
}

/** Letters not yet claimed. */
export const unclaimed = (save = getSave()) => (save.mail || []).filter(m => !m.claimed);

/** Open a letter and pay it. Returns the PokéCoins paid (0 if it was already claimed). */
export function claim(id) {
  const m = (getSave().mail || []).find(x => x.id === id);
  if (!m || m.claimed) return 0;
  updateSave(d => { const x = d.mail.find(y => y.id === id); if (x) x.claimed = Date.now(); });
  return m.coins ? awardCoins(m.coins) : 0;
}

/** `?mail` drops three sample letters for a playtest into an empty mailbox (saved like real ones, so they can be claimed;
    only once, so a bookmarked link isn't a coin tap). */
export function sampleMail() {
  if (!mailOn() || (getSave().mail || []).length) return;
  post('lab', 'Page complete!', 'Congratulations on completing the Whispering Clearing page of your Pokédex! Please accept this reward for your research.', 300);
  post('safari', 'A full page!', 'Every Pokémon of the Meadow is in your Safari Pokédex. The rangers send their thanks.', 1000);
  post('league', 'Jackpot!', 'Your first Trainer Level 5 win with a Fire Pokémon! The League rewards a true champion.', 500);
}
