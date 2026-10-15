/* towns.js  -  the save's side of the gateway towns (their data and rules: js/data/towns.js). trackTowns() counts play
   into a town's questline step, or once that's done the request up on its board, from the same events as the missions
   (mission() in js/run.js); a finished one is handed in at the board on a later visit (townRoom() in js/run.js), paying
   PokéCoins. A questline's step may take materials from the Satchel or put a key item in it (js/satchel.js). */

import { getSave, updateSave, awardCoins } from './storage.js';
import { townsOpen, TOWNS, REQUEST_COINS, QUEST_COINS, townState, countTown, currentRequest, requestText, handIn, mended, folkKey,
  openQuest, questStep, questDone, stepText, handInStep, stepReady, waystoneGuest, placeOf } from './data/towns.js';
import { shardsLit } from './data/towns.js';
import { satchelOf } from './data/satchel.js';
import { streamOf } from './rng.js';
import { safariDay } from './data/safari.js';
import { gainMat, gainKey } from './satchel.js';

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

/** A leader has greeted you: the town's questline opens on its board (and a "!" in the Satchel's Quests). */
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

/** Note that you've walked into a town once (its first-visit line). */
export function metTown(id) {
  if (townState(getSave(), id).met) return;
  updateSave(d => { d.towns = { ...(d.towns || {}), [id]: { ...townState(d, id), met: true } }; });
}

/** Whether `id`'s Waystone is mended, so its crystal on the Clearing's Waystone is lit and you can travel there from home. */
export const isMended = (id, save = getSave()) => mended(townState(save, id));

/** The townsfolk you've invited to live in your Secret Base ("<town>:<pokemon>" keys, js/data/towns.js's folkKey()). */
export const invitedFolk = (save = getSave()) => save.townsfolk || [];

/** Invite a townsperson home: they join the Secret Base's residents (moving straight in while there's room, else waiting
    in the PC's Base residents). */
export function inviteFolk(town, id, room) {
  const key = folkKey(town, id);
  updateSave(d => {
    d.townsfolk = [...new Set([...(d.townsfolk || []), key])];
    if (!d.secretBase || !room) return;
    const now = d.secretBase.mons ?? room.shown;
    if (now.length < room.max && !now.includes(key)) d.secretBase.mons = [...now, key];
  });
}

/** The leader who put a town's shard in has welcomed you home at the Clearing's Waystone: from now on its guests rotate. */
export function welcomeHome(id) {
  const st = townState(getSave(), id);
  if (!st.quest?.lit || st.quest.welcomed) return;
  updateSave(d => { d.towns = { ...(d.towns || {}), [id]: { ...st, quest: { ...st.quest, welcomed: true } } }; });
}

/** Today's Gym Leader by the Clearing's Waystone (js/data/towns.js's waystoneGuest()), or null: dealt by the UTC day. */
export const todaysGuest = (save = getSave()) => waystoneGuest(save, streamOf(safariDay(), 'waystone-guest'));

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
