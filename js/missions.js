/* ============================================================
   missions.js  -  the save's side of the daily and weekly missions (their pool and rules: js/data/missions.js).
   track() counts play into them as it happens (js/run.js); the Clearing's PC lists them and pays them (js/pc.js). With
   the old sign title there's no PC to walk to, so a finished mission is paid at once, like the mail (js/mail.js).
   ============================================================ */

import { getSave, updateSave, awardCoins, coinsWithBonus } from './storage.js';
import { mailOn } from './mail.js';
import { BONUS, MISSIONS_BY_ID, missionText, missionDay, missionWeek, freshRoll, countInto, isDone, bonusReady } from './data/missions.js';

const KINDS = ['daily', 'weekly'];
const keyOf = (kind, now) => (kind === 'daily' ? missionDay(now) : missionWeek(now));

/** Today's and this week's missions, rolled anew (and saved) once the day or the week has turned. */
export function missions(now = new Date()) {
  const save = getSave(), m = save.missions || {};
  if (KINDS.every(k => m[k]?.key === keyOf(k, now))) return m;
  updateSave(d => {
    d.missions = { ...(d.missions || {}) };
    for (const k of KINDS) if (d.missions[k]?.key !== keyOf(k, now)) d.missions[k] = freshRoll(k, keyOf(k, now), d);
  });
  return getSave().missions;
}

/** Count play into the missions: `events` one event or several, `amount` of it, `ctx` what a mission may filter on
    ({ type, level, safari }). Returns lines saying what just finished, for the run's text box. */
export function track(events, amount = 1, ctx = {}) {
  if (!amount || amount < 0) return [];
  missions();
  const lines = [];
  let dailies = 0;
  updateSave(d => {
    for (const k of KINDS) {
      for (const ev of [].concat(events)) {
        for (const m of countInto(d.missions[k], ev, amount, ctx)) {
          if (k === 'daily') dailies += 1;
          lines.push(finished(d, k, m));
        }
      }
    }
    if (dailies) for (const m of countInto(d.missions.weekly, 'daily', dailies)) lines.push(finished(d, 'weekly', m));
  });
  return lines;
}

/** A mission just done: paid there and then without a PC (the old sign title), else a line pointing at the PC. */
function finished(d, kind, m) {
  if (!mailOn()) {
    const entry = d.missions[kind].list.find(e => e.id === m.id);
    entry.claimed = true;
    let paid = awardCoins(m.coins);
    if (bonusReady(d.missions[kind])) { d.missions[kind].bonus = true; paid += awardCoins(BONUS[kind]); }
    return `🎯 Mission complete: ${missionText(m)}! +${paid} PokéCoins.`;
  }
  return `🎯 ${kind === 'daily' ? 'Daily' : 'Weekly'} mission complete: ${missionText(m)}! Claim ${coinsWithBonus(m.coins)} PokéCoins at the PC.`;
}

/** Missions finished and not yet paid, and bonuses ready: the PC's "!" counts them. */
export function claimable(save = getSave()) {
  const m = save.missions || {};
  return KINDS.reduce((n, k) => {
    const roll = m[k];
    if (!roll || roll.key !== keyOf(k, new Date())) return n;
    return n + roll.list.filter(e => isDone(e) && !e.claimed).length + (bonusReady(roll) ? 1 : 0);
  }, 0);
}

/** Pay a finished mission. Returns the PokéCoins paid (0 if it isn't done or was paid). */
export function claimMission(kind, id) {
  const entry = missions()[kind]?.list.find(e => e.id === id);
  if (!entry || entry.claimed || !isDone(entry)) return 0;
  updateSave(d => { d.missions[kind].list.find(e => e.id === id).claimed = true; });
  return awardCoins(MISSIONS_BY_ID[id].coins);
}

/** Pay the bonus for finishing every mission of the day or the week. */
export function claimBonus(kind) {
  if (!bonusReady(missions()[kind])) return 0;
  updateSave(d => { d.missions[kind].bonus = true; });
  return awardCoins(BONUS[kind]);
}

/** How long until the day's or the week's missions change, as "5h 12m" or "3d 4h". */
export function timeLeft(kind, now = new Date()) {
  const end = new Date(`${keyOf(kind, now)}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + (kind === 'daily' ? 1 : 7));
  const mins = Math.max(1, Math.ceil((end - now) / 60000)), h = Math.floor(mins / 60);
  return h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : h ? `${h}h ${mins % 60}m` : `${mins}m`;
}
