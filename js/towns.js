/* towns.js  -  the save's side of the gateway towns (their data and rules: js/data/towns.js). trackTowns() counts play
   into the request up on a town's board, from the same events as the missions (mission() in js/run.js); a finished one
   is handed in at the board on a later visit (townRoom() in js/run.js), paying PokéCoins and the town's friendship. */

import { getSave, updateSave, awardCoins } from './storage.js';
import { TOWNS, REQUEST_COINS, townState, countRequest, currentRequest, requestText, handIn, mended, folkKey } from './data/towns.js';

/** Count play into the request of the town whose biome `ctx.biome` is; lines saying one just finished. */
export function trackTowns(events, amount, ctx) {
  const town = TOWNS[ctx.biome];
  if (!town) return [];
  let st = townState(getSave(), town.id), done = false;
  const before = st;
  for (const ev of [].concat(events)) {
    const r = countRequest(town, st, ev, amount, ctx);
    st = r.st;
    done ||= r.finished;
  }
  if (st === before) return [];
  updateSave(d => { d.towns = { ...(d.towns || {}), [town.id]: st }; });
  return done ? [`📜 ${town.name}'s request done: ${requestText(currentRequest(town, st))}! Hand it in at its board next time you pass.`] : [];
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
