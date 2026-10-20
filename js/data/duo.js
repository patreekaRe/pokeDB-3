/* ============================================================
   duo.js  -  the Safari's duo (docs/duo-design.md sections 1-3).

   A Duo Run brings two starters of different types, one out at a time: one HP bar, two decks (each partner its own
   solo starting deck and its own piles in battle; session 1b, 2026-10-19), a shared evolution stage. The one out defends as its deck's type, gets STAB on its type's attacks and is the only
   Ability that works; switching costs DUO_SWITCH_PP on your turn. The duo pool starts as Fire / Grass / Water (every
   owned starter of a type is a look for it); a new type joins when any stage of one of its starter lines is caught in
   the Safari (DUO_LINES, filled by each type's session). Pure, so the sim can import it.
   ============================================================ */

import { STARTERS_BY_ID } from './starters.js';
import { poolForType, typePool, CARDS_BY_ID, baseId } from './cards.js';
import { itemsForType } from './items.js';

/** PP a switch costs (the user's answer 2). */
export const DUO_SWITCH_PP = 1;
/** Same-type attack bonus: a card of the type that's out deals this much more attack damage (answer 3). */
export const STAB = 1.2;

/** The types every duo pool starts with. */
export const DUO_BASE = ['fire', 'grass', 'water'];

/** A new type's starter lines, type -> { look: [every stage's species id] }: catching any stage adds the type with that
    look. Each type's sessions fill it (Electric's first brought Shinx's line; its second the other four lines; Ice's first Vanillite's; Fighting's first Timburr's, its second Machop's; Ground's first Trapinch's, its second Rhyhorn's). */
export const DUO_LINES = {
  electric: {
    shinx: ['shinx', 'luxio', 'luxray'], mareep: ['mareep', 'flaaffy', 'ampharos'], pichu: ['pichu', 'pikachu', 'raichu'],
    elekid: ['elekid', 'electabuzz', 'electivire'], tynamo: ['tynamo', 'eelektrik', 'eelektross'],
  },
  ice: { vanillite: ['vanillite', 'vanillish', 'vanilluxe'], swinub: ['swinub', 'piloswine', 'mamoswine'] },
  fighting: { timburr: ['timburr', 'gurdurr', 'conkeldurr'], machop: ['machop', 'machoke', 'machamp'] },
  ground: { trapinch: ['trapinch', 'vibrava', 'flygon'], rhyhorn: ['rhyhorn', 'rhydon', 'rhyperior'] },
  flying: { starly: ['starly', 'staravia', 'staraptor'] },
};

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
  if (!a || !b || a.type === b.type || !a.deck?.length || !b.deck?.length || a.secret || b.secret) return null;
  return { ids: [a.id, b.id], out: duo.out === 1 ? 1 : 0 };
}

/** A new duo with its two decks: each partner's own solo starting deck (the user's call after session 1, rule 1b). */
export function newDuo(ids) {
  const duo = validDuo({ ids, out: 0 });
  return duo && { ...duo, decks: duoStarters(duo).map(s => [...s.deck]), loose: [] };
}

/** The run's whole deck, as `run.deck` mirrors it: the lead's, the partner's, then any Neutral card not yet given. */
export const duoDeck = (duo) => [...duo.decks[0], ...duo.decks[1], ...duo.loose];

const counts = (ids) => ids.reduce((m, id) => m.set(id, (m.get(id) || 0) + 1), new Map());
const sameCards = (x, y) => { const a = counts(x), b = counts(y); return a.size === b.size && [...a].every(([id, n]) => b.get(id) === n); };

/** A saved duo with its decks (rule 6): the pair, two decks of known cards and the loose ones, matching `deck`. A duo
    saved before the decks (session 1, on the branch only) has none, and the run is dropped. */
export function restoreDuo(saved, deck) {
  const duo = validDuo(saved);
  const ok = (ids) => Array.isArray(ids) && ids.every(id => CARDS_BY_ID[id]);
  if (!duo || !Array.isArray(saved.decks) || saved.decks.length !== 2 || !saved.decks.every(ok) || !ok(saved.loose || [])) return null;
  const restored = { ...duo, decks: saved.decks.map(d => [...d]), loose: [...(saved.loose || [])] };
  return sameCards(duoDeck(restored), deck) ? restored : null;
}

/** Which partner a card belongs to by its type (0 or 1), or -1 for a Neutral card, a status card or a token. */
export const ownerOf = (duo, id) => duoStarters(duo).findIndex(s => s.type === CARDS_BY_ID[id]?.type);

/** A Neutral card a partner is asked to take (rule 4): one you'd pick, not a status card or a token. */
export const asksOwner = (id) => { const c = CARDS_BY_ID[id]; return !!c && !c.status && !c.token && c.type === 'normal'; };

/**
 * Keep a duo's two decks in step with `run.deck` (rules 4-6). Most of the game changes `run.deck` as it always has (a
 * reward pushes, the Center splices, an event swaps); this reads what changed since the decks last matched and makes
 * the same change to the right deck:
 *   a card gone          from the deck `aim.from` (a grouped picker's pick), else its type's, else whoever holds it,
 *                        the one out first
 *   a card come          to the deck of its type; a card replacing one of the same base (an upgrade) to that one's
 *                        deck; a Neutral one to `aim.to`, else into `loose` until you say who takes it (`asksOwner`),
 *                        a status card or token to the one out
 * Then `run.deck` is rewritten in the decks' order. Pure, so the sim can use it too.
 */
export function syncDecks(run, aim = {}) {
  const duo = run.duo;
  if (!duo?.decks) return;
  const have = counts(run.deck), held = counts(duoDeck(duo));
  const gone = [], come = [];
  for (const [id, n] of held) for (let i = (have.get(id) || 0); i < n; i++) gone.push(id);
  for (const [id, n] of have) for (let i = (held.get(id) || 0); i < n; i++) come.push(id);
  if (!gone.length && !come.length) return;
  const piles = [duo.decks[0], duo.decks[1], duo.loose];
  const take = (pile, id) => { const i = pile.lastIndexOf(id); if (i < 0) return false; pile.splice(i, 1); return true; };
  const order = (first) => [first, ...[duo.out, 1 - duo.out, 2].filter(i => i !== first)].filter(i => i >= 0);
  const left = [];   // where each removed card was, by its base, so an upgrade or a swap goes back to the same deck
  for (const id of gone) {
    const from = order(aim.from ?? ownerOf(duo, id)).find(i => take(piles[i], id));
    if (from !== undefined) left.push([baseId(id), from]);
  }
  for (const id of come) {
    const same = left.findIndex(([b, from]) => b === baseId(id) && from < 2);
    let to = ownerOf(duo, id);
    if (same >= 0) { to = left[same][1]; left.splice(same, 1); }
    else if (to < 0) to = aim.to ?? (asksOwner(id) ? 2 : duo.out);
    piles[to].push(id);
  }
  run.deck = duoDeck(duo);
}

const unique = (list) => [...new Set(list)];

/** Every card a run's types can be offered, Neutral cards once (the Mart, the Move Tutor, the ? events). */
export const runPool = (run) => unique(runTypes(run).flatMap(t => poolForType(t, !!run.duo)));
/** Every card of the run's own types, no Neutral (Metronome's). */
export const runTypePool = (types) => unique(types.flatMap(typePool));
/** Items for the run's types: a type's `only` ones for either. */
export const runItems = (types) => unique(types.flatMap(itemsForType));
/** Whether a relic or item limited to one type (`only`) fits a run of these types. */
export const fitsTypes = (only, types) => !only || types.includes(only);
/** Whether a relic fits a run: its type (`only`), and a Duo Run's own (`duo`: Shed Shell) only in one. */
export const fitsRun = (relic, run) => fitsTypes(relic.only, runTypes(run)) && (!relic.duo || !!run.duo);

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
