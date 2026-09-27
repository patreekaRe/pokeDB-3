/* ============================================================
   pokedex.js  -  the Pokédex's pages and what finishing one gives.

   One page per biome: its 12 wild Pokémon, then its elites and bosses,
   in the order BIOMES lists them. An entry is "seen" once you've fought
   it and "defeated" (the games' caught) once you've beaten it; a page is
   complete when every entry on it is defeated. Finishing a page pays
   PokéCoins once and switches on a small permanent perk (Neow-style
   run-start bonuses, StS's). Perks can't be bought at the Game Corner.
   ============================================================ */

import { BIOMES } from './enemies.js';

export const DEX_PERKS = {
  clearing: {
    id: 'moms-savings', name: 'Mom\'s Savings', icon: '💴', coins: 100,
    text: 'Start every run with ₽50.',
  },
  shrine: {
    id: 'chansey-gift', name: 'Chansey\'s Gift', icon: '🧴', coins: 150,
    text: 'Start every run with a Potion in the Bag.',
  },
  wastes: {
    id: 'oaks-advice', name: 'Oak\'s Advice', icon: '🎓', coins: 200,
    text: 'Once per biome, reroll a card reward for 3 new cards.',
  },
};

export const DEX_START_MONEY = 50;

export const DEX_PAGES = BIOMES.map(b => ({
  biome: b.id,
  name: b.name,
  ids: [...b.normals, ...b.elites, ...b.bosses],
  role: Object.fromEntries([...b.normals.map(id => [id, 'wild']), ...b.elites.map(id => [id, 'elite']), ...b.bosses.map(id => [id, 'boss'])]),
  perk: DEX_PERKS[b.id],
}));

/** Every entry in dex order, numbered from 1 like the games. */
export const DEX_NUMBER = Object.fromEntries(DEX_PAGES.flatMap(p => p.ids).map((id, i) => [id, i + 1]));
