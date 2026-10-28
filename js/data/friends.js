/* friends.js  -  the Pokédex's Friends app (2026-10-16, the user's ask: friendship belongs in the device you carry
   everywhere, by the Quests app, not on the Clearing's PC), its rules without the page: who's met, what the next heart
   brings, and its "!". The app wears a "!" until it's first opened (`save.friendsSeen` made then, every friend stamped as
   they are), and after that a friend met, or with a heart or their favourite given since the page last showed them,
   wears one till they're shown. The page is js/friendsdex.js. */

import { FRIENDS, FAVOURITE, HEARTS, HEART_AT, MAIL_HEARTS, VISIT_HEARTS, SECRET_AT, SECRETS, heartsOf, heartPieces, workshopOf } from './workshop.js';
import { FAVOUR_HEARTS } from './favours.js';
import { friendWins, LEADER_VISITS_LIVE } from './gym.js';
import { townsOpen } from './towns.js';

/** The app shows (and the PC's FRIENDS row): with the towns on, once a Gym Leader who takes gifts is beaten. */
export const friendsOpen = (save) => townsOpen() && FRIENDS.some(id => friendWins(save, id) > 0);

/** Met: beaten at their Gym, or a gift already given. */
export const friendMet = (save, id) => friendWins(save, id) > 0 || heartsOf(workshopOf(save), id) > 0;

/** How a friend stood when the page last showed them: their hearts, `f` once their favourite's given ('3f'); unmet, null. */
export function friendStamp(save, id) {
  if (!friendMet(save, id)) return null;
  const ws = workshopOf(save);
  return `${heartsOf(ws, id)}${ws.fond.includes(id) ? 'f' : ''}`;
}

/** A friend new to the page, or changed since it last showed them (never before the app's first open: the app's own "!"). */
export function friendFresh(save, id) {
  const now = friendStamp(save, id);
  return !!save.friendsSeen && now !== null && save.friendsSeen[id] !== now;
}

/** The "!" on the device's Friends app: never opened, or a friend fresh in it. */
export const friendsNews = (save) => friendsOpen(save) && (!save.friendsSeen || FRIENDS.some(id => friendFresh(save, id)));

/** `save.friendsSeen` once the page has shown `ids` (all of them: the app's first open). */
export function seeFriends(save, ids = FRIENDS) {
  const now = ids.map(id => [id, friendStamp(save, id)]).filter(([, s]) => s !== null);
  return { ...(save.friendsSeen || {}), ...Object.fromEntries(now) };
}

/** A friend's three pieces: their favourite gift's (once it's given), then one at each of HEART_AT. */
export const friendPieces = (save, id, hearts = heartsOf(workshopOf(save), id)) => [
  { kind: FAVOURITE[id]?.sig, at: null, got: workshopOf(save).fond.includes(id) },
  ...heartPieces(id).map(p => ({ ...p, got: hearts >= p.at })),
].filter(p => p.kind);

/** What the next heart that brings anything brings: { at, piece (a kind or null), perks: [ids] }; null at HEARTS. */
export function nextHeart(id, hearts) {
  const perks = [[MAIL_HEARTS, 'letters'], ...(LEADER_VISITS_LIVE ? [[VISIT_HEARTS, 'visits']] : []), [FAVOUR_HEARTS, 'requests'], ...(SECRETS[id] ? [[SECRET_AT, 'recipe']] : []), [HEARTS, 'badge']];
  const ats = [...perks.map(([at]) => at), ...HEART_AT].filter(at => at > hearts);
  if (!ats.length) return null;
  const at = Math.min(...ats);
  return { at, piece: heartPieces(id).find(p => p.at === at)?.kind ?? null, perks: perks.filter(([n]) => n === at).map(([, p]) => p) };
}
