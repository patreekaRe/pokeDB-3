/* ============================================================
   starters.js  -  the nine starter Pokémon you can pick.

   Sprites are Gen 5 pixel art from the PokeAPI sprites project
   (see the credits in the README). The files live in assets/pokemon/.
   ============================================================ */

/*
  unlockAt = total battle wins needed to unlock this starter.
  The three Kanto starters are free; the others are rewards.
*/
export const STARTERS = [
  { id: 'charmander', name: 'Charmander', type: 'fire',  unlockAt: 0,  blurb: 'Fast, fiery attacks. Hits hard when hurt.' },
  { id: 'bulbasaur',  name: 'Bulbasaur',  type: 'grass', unlockAt: 0,  blurb: 'Steady damage that heals you as you fight.' },
  { id: 'squirtle',   name: 'Squirtle',   type: 'water', unlockAt: 0,  blurb: 'Tough shell, quick draws, reliable water attacks.' },

  { id: 'cyndaquil',  name: 'Cyndaquil',  type: 'fire',  unlockAt: 5,  blurb: 'A second fire starter with the same fiery deck.' },
  { id: 'chikorita',  name: 'Chikorita',  type: 'grass', unlockAt: 5,  blurb: 'A second grass starter with the same leafy deck.' },
  { id: 'totodile',   name: 'Totodile',   type: 'water', unlockAt: 5,  blurb: 'A second water starter with the same watery deck.' },

  { id: 'torchic',    name: 'Torchic',    type: 'fire',  unlockAt: 10, blurb: 'A third fire starter with the same fiery deck.' },
  { id: 'treecko',    name: 'Treecko',    type: 'grass', unlockAt: 10, blurb: 'A third grass starter with the same leafy deck.' },
  { id: 'mudkip',     name: 'Mudkip',     type: 'water', unlockAt: 10, blurb: 'A third water starter with the same watery deck.' },
];

export const STARTERS_BY_ID = Object.fromEntries(STARTERS.map(s => [s.id, s]));

/** Path to one of a starter's images: kind is 'front', 'back' or 'icon'. */
export function spriteUrl(starter, kind) {
  return `assets/pokemon/${starter.id}-${kind}.${kind === 'icon' ? 'png' : 'gif'}`;
}

/** Which backdrop picture goes with each type. */
export const BACKDROPS = {
  fire:  'assets/backgrounds/volcano.jpg',
  grass: 'assets/backgrounds/shrine.jpg',
  water: 'assets/backgrounds/clearing.jpg',
};
