/* ============================================================
   duo.js  -  the Safari's duo (docs/duo-design.md sections 1-3).

   A Duo Run brings two starters of different types, one out at a time: one HP bar, one deck (half each type), a
   shared evolution stage. The one out defends as its deck's type, gets STAB on its type's attacks and is the only
   Ability that works; switching costs DUO_SWITCH_PP on your turn. The duo pool starts as Fire / Grass / Water (every
   owned starter of a type is a look for it); a new type joins when any stage of one of its starter lines is caught in
   the Safari (DUO_LINES, filled by each type's session). Pure, so the sim can import it.
   ============================================================ */

import { STARTERS_BY_ID } from './starters.js';
import { poolForType, typePool } from './cards.js';
import { itemsForType } from './items.js';

/** PP a switch costs (the user's answer 2). */
export const DUO_SWITCH_PP = 1;
/** Same-type attack bonus: a card of the type that's out deals this much more attack damage (answer 3). */
export const STAB = 1.2;

/** The types every duo pool starts with. */
export const DUO_BASE = ['fire', 'grass', 'water'];

/** Each type's half of a duo's 10-card deck: its 2 basic attacks, 2 basic blocks and Bash-like signature (answer 6). */
export const DUO_DECK = {
  fire: ['ember', 'ember', 'flame-wall', 'flame-wall', 'scorch'],
  grass: ['vine-whip', 'vine-whip', 'block', 'block', 'seed-bomb'],
  water: ['water-gun', 'water-gun', 'withdraw', 'withdraw', 'water-pulse'],
};

/** A new type's starter lines, type -> { look: [every stage's species id] }: catching any stage adds the type with that
    look. Empty until the type sessions bring Electric, Ice, Fighting, Ground, Flying and Dark. */
export const DUO_LINES = {};

/** The two starters of a duo, lead first. */
export const duoStarters = (duo) => duo.ids.map(id => STARTERS_BY_ID[id]);

/** The types a run plays: a duo's two, else its starter's one. */
export const runTypes = (run) => (run.duo ? duoStarters(run.duo).map(s => s.type) : [run.starter.type]);

/** The starter out right now (a duo's `out`), else the run's starter. */
export const outStarter = (run) => (run.duo ? STARTERS_BY_ID[run.duo.ids[run.duo.out]] : run.starter);

/** The benched partner, or null outside a duo. */
export const benchStarter = (run) => (run.duo ? STARTERS_BY_ID[run.duo.ids[1 - run.duo.out]] : null);

/** A saved duo that still makes sense: two known starters of different types, `out` 0 or 1. */
export function validDuo(duo) {
  if (!duo || !Array.isArray(duo.ids) || duo.ids.length !== 2) return null;
  const [a, b] = duo.ids.map(id => STARTERS_BY_ID[id]);
  if (!a || !b || a.type === b.type || !DUO_DECK[a.type] || !DUO_DECK[b.type]) return null;
  return { ids: [a.id, b.id], out: duo.out === 1 ? 1 : 0 };
}

/** A duo's starting deck: the lead's half, then the partner's. */
export const duoDeck = (duo) => duoStarters(duo).flatMap(s => DUO_DECK[s.type]);

const unique = (list) => [...new Set(list)];

/** Every card a run's types can be offered, Neutral cards once (the Mart, the Move Tutor, the ? events). */
export const runPool = (run) => unique(runTypes(run).flatMap(poolForType));
/** Every card of the run's own types, no Neutral (Metronome's). */
export const runTypePool = (types) => unique(types.flatMap(typePool));
/** Items for the run's types: a type's `only` ones for either. */
export const runItems = (types) => unique(types.flatMap(itemsForType));
/** Whether a relic or item limited to one type (`only`) fits a run of these types. */
export const fitsTypes = (only, types) => !only || types.includes(only);

/** A duo card reward's type for each of its 3 slots: one of each, the third either (answer 7). `coin` is a 0-1 roll. */
export const rewardSlots = (types, count, coin) => [types[0], types[1], types[coin < 0.5 ? 0 : 1]].slice(0, count);

/** The types a save's duo pool holds, with the looks for each: the base three (every owned starter of the type), then
    each type caught since (save.duoPool). `owned(starter)` says whether a starter is yours. */
export function duoPool(save, starters, owned) {
  const pool = {};
  for (const type of DUO_BASE) pool[type] = starters.filter(s => s.type === type && !s.secret && !s.safariPrize && owned(s)).map(s => s.id);
  for (const [type, looks] of Object.entries(save.duoPool || {})) {
    const known = looks.filter(id => STARTERS_BY_ID[id]?.type === type);
    if (known.length) pool[type] = unique([...(pool[type] || []), ...known]);
  }
  return pool;
}

/** What `caught` (Safari Pokédex ids) adds to a save's duo pool: { type: [looks] } for the starter lines with a caught
    stage that aren't in it yet. `lines` defaults to DUO_LINES. */
export function duoGains(caught, pool = {}, lines = DUO_LINES) {
  const have = new Set(caught), gains = {};
  for (const [type, looks] of Object.entries(lines)) {
    for (const [look, stages] of Object.entries(looks)) {
      if ((pool[type] || []).includes(look) || !stages.some(id => have.has(id))) continue;
      (gains[type] ||= []).push(look);
    }
  }
  return gains;
}

/** A Duo Run opens for the day once that day's free Daily run is finished, won or lost (answer 10). */
export const duoOpen = (safari = {}, day) => safari.done === day;
