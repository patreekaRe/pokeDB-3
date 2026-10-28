/* towns.js  -  the save's side of the gateway towns (their data and rules: js/data/towns.js). trackTowns() counts play
   into a town's questline step, or once that's done the request up on its board, from the same events as the missions
   (mission() in js/run.js); a finished one is handed in at the board on a later visit (townRoom() in js/run.js), paying
   PokéCoins. A questline's step may take materials from the Satchel or put a key item in it (js/satchel.js). */

import { getSave, updateSave, awardCoins } from './storage.js';
import { townsOpen, TOWNS, REQUEST_COINS, QUEST_COINS, townState, countTown, currentRequest, requestText, handIn, mended,
  openQuest, questStep, questDone, stepText, handInStep, stepReady, waystoneGuest, placeOf } from './data/towns.js';
import { shardsLit } from './data/towns.js';
import { satchelOf } from './data/satchel.js';
import { streamOf } from './rng.js';
import { safariDay } from './data/safari.js';
import { gainMat, gainKey } from './satchel.js';
import { FAVOURS, FAVOUR_COINS, FRIEND_TOWN, favourOf, asking, countFavour, currentFavour, favourText, handInFavour } from './data/favours.js';
import { workshopOf, heartsOf, gifteeOf } from './data/workshop.js';
import { GYM_BY_ID, LEADER_VISITS_LIVE } from './data/gym.js';

/** Count play into the request of the town whose biome `ctx.biome` is; lines saying one just finished. */
export function trackTowns(events, amount, ctx) {
  const town = placeOf(ctx.biome);   // the Clearing's too: the Nietos' questline (step 7)
  if (!town || !townsOpen()) return [];
  let st = townState(getSave(), town.id), done = false;
  const before = st;
  for (const ev of [].concat(events)) {
    const r = countTown(town, st, ev, amount, ctx);
    st = r.st;
    done ||= r.finished;
  }
  if (st === before) return [];
  updateSave(d => { d.towns = { ...(d.towns || {}), [town.id]: st }; });
  if (!done) return [];
  return questDone(town, st) ? [`📜 ${town.name}'s request done: ${requestText(currentRequest(town, st))}! Hand it in at its board next time you pass.`]
    : [`📜 ${town.name}'s quest: ${stepText(questStep(town, st))}, done! ${town.home ? 'Tell the Nietos at home.' : 'Tell them at its board next time you pass.'}`];
}

/** Count play into every friend's own request (js/data/favours.js) while they're asking; lines saying one just finished. */
export function trackFavours(events, amount, ctx) {
  if (!townsOpen()) return [];
  const save = getSave(), ws = workshopOf(save), out = {}, lines = [];
  for (const id of Object.keys(FAVOURS)) {
    if (!asking(id, heartsOf(ws, id))) continue;
    let fs = favourOf(save, id), done = false;
    const before = fs;
    for (const ev of [].concat(events)) {
      const r = countFavour(id, fs, ev, amount, ctx.biome);
      fs = r.fs;
      done ||= r.finished;
    }
    if (fs === before) continue;
    out[id] = fs;
    if (done) {
      const town = placeOf(FRIEND_TOWN[id]);
      lines.push(`💌 ${gifteeOf(id, GYM_BY_ID[id].name)}'s request done: ${favourText(currentFavour(id, fs))}! Hand it in at their home in ${town.name} next time you're there.`);
    }
  }
  if (Object.keys(out).length) updateSave(d => { d.favours = { ...(d.favours || {}), ...out }; });
  return lines;
}

/** Hand a friend's finished request in: the next one up, PokéCoins paid. Returns the coins (0 if it wasn't ready). */
export function handInFriend(id) {
  const fs = favourOf(getSave(), id);
  if (!fs.ready) return 0;
  updateSave(d => { d.favours = { ...(d.favours || {}), [id]: handInFavour(fs) }; });
  return awardCoins(FAVOUR_COINS);
}

/** A leader has greeted you: the town's questline opens on its board (and a "!" on the Pokédex's Quests app, js/questlog.js). */
export function startQuest(id) {
  if (townState(getSave(), id).quest) return;
  updateSave(d => {
    d.towns = { ...(d.towns || {}), [id]: openQuest(townState(d, id)) };
    const sat = satchelOf(d, false);
    d.satchel = { ...sat, fresh: [...new Set([...sat.fresh, `q:${id}`])] };
  });
}

/** Hand in the questline's step up now (`pick` for a step that asks you to choose): its materials taken from the Satchel,
    its key item given, PokéCoins paid. Returns the coins, or null if it wasn't ready (`force`: a `?satchel` playtest). */
export function handInQuest(id, pick = null, force = false) {
  const town = placeOf(id), st = townState(getSave(), id), step = questStep(town, st);
  if (!step || !(force || stepReady(step, st, satchelOf(getSave())))) return null;
  if (step.kind === 'gather') gainMat(step.item, -step.n);
  if (step.gives) gainKey(step.gives);
  updateSave(d => { d.towns = { ...(d.towns || {}), [id]: handInStep(town, townState(d, id), pick) }; });
  return awardCoins(QUEST_COINS);
}

/** Hand in a town's finished request: its friendship up a step, PokéCoins paid. Returns the coins (0 if none was ready). */
export function handInRequest(id) {
  const st = townState(getSave(), id);
  if (!st.ready) return 0;
  updateSave(d => { d.towns = { ...(d.towns || {}), [id]: handIn(st) }; });
  return awardCoins(REQUEST_COINS);
}

/** The town's quest board read once: its "!" goes (it showed from the questline's posting till then). */
export function readBoard(id) {
  if (townState(getSave(), id).board) return;
  updateSave(d => { d.towns = { ...(d.towns || {}), [id]: { ...townState(d, id), board: true } }; });
}

/** Note that a questline's leaders have sent you to its board (the Nietos' call home, js/hub-3d.js's homeNews()), so it plays once. */
export function heardCall(id) {
  if (townState(getSave(), id).called) return;
  updateSave(d => { d.towns = { ...(d.towns || {}), [id]: { ...townState(d, id), called: true } }; });
}

/** Note that you've walked into a town once (its first-visit line). */
export function metTown(id) {
  if (townState(getSave(), id).met) return;
  updateSave(d => { d.towns = { ...(d.towns || {}), [id]: { ...townState(d, id), met: true } }; });
}

/** Whether `id`'s Waystone is mended, so its crystal on the Clearing's Waystone is lit and you can travel there from home. */
export const isMended = (id, save = getSave()) => mended(townState(save, id));

/** The leader who put a town's shard in has welcomed you home at the Clearing's Waystone: from now on its guests rotate. */
export function welcomeHome(id) {
  const st = townState(getSave(), id);
  if (!st.quest?.lit || st.quest.welcomed) return;
  updateSave(d => { d.towns = { ...(d.towns || {}), [id]: { ...st, quest: { ...st.quest, welcomed: true } } }; });
}

/** Today's Gym Leader by the Clearing's Waystone (js/data/towns.js's waystoneGuest()), or null: dealt by the UTC day.
    None while LEADER_VISITS_LIVE is off, bar a `?visit` peek. */
export const todaysGuest = (save = getSave()) => (LEADER_VISITS_LIVE || (typeof location !== 'undefined' && new URLSearchParams(location.search).has('visit'))
  ? waystoneGuest(save, streamOf(safariDay(), 'waystone-guest')) : null);

/* The Depths camp's memory (docs/roadmap.md's step 5, the user's call 2026-10-15): a won run's landing there is a walk
   only when something new waits (the camp never walked, or a shard Mewtwo hasn't seen lit), else one tap through. Under
   `?shards=N` it lasts the page load, never saved. */
const shardsFlag = () => typeof location !== 'undefined' && new URLSearchParams(location.search).has('shards');
let peekSeen = null;
const campSeen = (save) => (shardsFlag() ? peekSeen : save.campLit) ?? null;

/** The shards lit since Mewtwo last saw the pentagram in the camp (RING order). */
export const campFresh = (save = getSave()) => { const seen = campSeen(save); return shardsLit(save).map((on, i) => on && !seen?.[i]); };
/** Whether the camp has something new: never walked, or a shard to hand over. */
export const campNews = (save = getSave()) => !campSeen(save) || campFresh(save).some(Boolean);
/** Mewtwo has seen the pentagram as it stands. */
export function sawCamp() {
  const lit = shardsLit(getSave());
  if (shardsFlag()) peekSeen = lit;
  else updateSave(d => { d.campLit = lit; });
}
