/* ============================================================
   real-types.js  -  the Safari Zone's real types (the roadmap's "Six new types for the Safari's duo pool", session 2).

   In a Safari run every wild Pokémon wears its real (dual) types and every move its real type, on the real 18-type
   chart (real-types-table.js, written by tools/real-types.py), with three changes: no immunities (an x0 is a
   resistance), the product capped at x2 and floored at x0.5 (so a hit is still super effective, neutral or not very
   effective, at the game's SUPER_EFFECTIVE / NOT_VERY_EFFECTIVE), and Neutral cards outside it (x1 both ways). Elites
   and bosses stay typeless (battle.js's typeless()). The main game keeps its Fire / Grass / Water triangle.
   ============================================================ */

import { CHART, SPECIES, MOVES } from './real-types-table.js';
import { SUPER_EFFECTIVE, NOT_VERY_EFFECTIVE } from './cards.js';

/** Each real type's name and icon (js/icons.js draws them all). The Normal type wears Neutral's star. */
export const REAL_TYPES = {
  normal:   { label: 'Normal',   icon: '🔯' },
  fire:     { label: 'Fire',     icon: '🔥' },
  water:    { label: 'Water',    icon: '💧' },
  grass:    { label: 'Grass',    icon: '🌿' },
  electric: { label: 'Electric', icon: '⚡' },
  ice:      { label: 'Ice',      icon: '❄️' },
  fighting: { label: 'Fighting', icon: '🥊' },
  poison:   { label: 'Poison',   icon: '☠️' },
  ground:   { label: 'Ground',   icon: '⛰️' },
  flying:   { label: 'Flying',   icon: '🪶' },
  psychic:  { label: 'Psychic',  icon: '🔮' },
  bug:      { label: 'Bug',      icon: '🐛' },
  rock:     { label: 'Rock',     icon: '🪨' },
  ghost:    { label: 'Ghost',    icon: '👻' },
  dragon:   { label: 'Dragon',   icon: '🐉' },
  dark:     { label: 'Dark',     icon: '🌙' },
  steel:    { label: 'Steel',    icon: '⚙️' },
  fairy:    { label: 'Fairy',    icon: '🌸' },
};

const FACTOR = Object.fromEntries(Object.entries(CHART).map(([attack, row]) => [attack, Object.fromEntries([
  ...(row.super || '').split(' ').filter(Boolean).map(t => [t, 2]),
  ...`${row.half || ''} ${row.none || ''}`.split(' ').filter(Boolean).map(t => [t, 0.5]),   // no immunities
])]));

const SPECIES_TYPES = Object.fromEntries(Object.entries(SPECIES).flatMap(([types, ids]) => ids.split(' ').map(id => [id, types.split(' ')])));
const MOVE_TYPES = Object.fromEntries(Object.entries(MOVES).flatMap(([type, names]) => names.split('|').map(name => [name, type])));

/** A Pokémon's real types (its def's `spriteId`), or its game type for one the table hasn't got. */
export const speciesTypes = (def) => SPECIES_TYPES[def.spriteId] ?? [def.type];

/** An enemy move's real type: the move's own, else its Pokémon's first. */
export const moveType = (move, def) => MOVE_TYPES[move.name] ?? speciesTypes(def)[0];

/** The real chart's x0.5-x2 for an attack of `type` on a Pokémon of `defenders` (capped both ways). */
export function realFactor(type, defenders) {
  const row = FACTOR[type];
  if (!row) return 1;
  return Math.min(2, Math.max(0.5, defenders.reduce((f, t) => f * (row[t] ?? 1), 1)));
}

/** The damage multiplier the battle uses: the game's own super / not very effective steps. A Neutral card (`normal`)
    is outside the chart. */
export function realMultiplier(type, defenders, { card = false } = {}) {
  if (card && type === 'normal') return 1;
  const f = realFactor(type, defenders);
  return f > 1 ? SUPER_EFFECTIVE : f < 1 ? NOT_VERY_EFFECTIVE : 1;
}

/** A wild Pokémon is a tough match-up when one of its types hits yours super effectively (the Safari's prize rule). */
export const realBeats = (def, starterType) => speciesTypes(def).some(t => realFactor(t, [starterType]) > 1);
