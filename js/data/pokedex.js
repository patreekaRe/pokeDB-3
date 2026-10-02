/* ============================================================
   pokedex.js  -  the Pokédex's pages and what finishing one gives.

   One page per biome: its 12 wild Pokémon, then its elites and bosses,
   in the order BIOMES lists them. An entry is "seen" once you've fought
   it and "defeated" (the games' caught) once you've beaten it; a page is
   complete when every entry on it is defeated. Finishing a page pays
   PokéCoins once and switches on a small permanent perk (Neow-style
   run-start bonuses, StS's); researching every entry on it raises the
   perk to Lv 2. Perks can't be bought at the Game Corner.
   ============================================================ */

import { BIOMES } from './enemies.js';

export const DEX_PERKS = {
  clearing: {
    id: 'moms-savings', name: 'Mom\'s Savings', icon: '💴', coins: 300,
    text: 'Start every run with ₽50.', short: 'Start runs with ₽50', gift: '₽50', every: 'every run',
    lv2: { text: 'Start every run with ₽100.', short: 'Start runs with ₽100', gift: '₽100' },
  },
  shrine: {
    id: 'chansey-gift', name: 'Chansey\'s Gift', icon: '🧴', coins: 400,
    text: 'Start every run with a Potion in the Bag.', short: 'Start runs with a Potion', gift: 'Potion', every: 'every run', item: 'potion',
    lv2: { text: 'Start every run with a Super Potion in the Bag.', short: 'Start runs with a Super Potion', gift: 'Super Potion', item: 'super-potion' },
  },
  wastes: {
    id: 'oaks-advice', name: 'Oak\'s Advice', icon: '🎓', coins: 500,
    text: 'Once per biome, reroll a card reward for 3 new cards.', short: 'Reroll a card reward once a biome', gift: '1 reroll', every: 'card rerolls each biome',
    lv2: { text: 'Twice per biome, reroll a card reward for 3 new cards.', short: 'Reroll a card reward twice a biome', gift: '2 rerolls' },
  },
};

export const DEX_START_MONEY = [0, 50, 100];   // by perk level: Lv 2 once the page's every entry is researched
export const DEX_START_ITEM = [null, 'potion', 'super-potion'];
export const DEX_REROLLS = [0, 1, 2];

/* Research (Legends: Arceus's research levels): every entry counts its defeats. At the goal it's
   Research complete (the entry shows each move's numbers) and pays its PokéCoins once; bosses are
   met once per biome per run, so they need fewer. Completing every entry pays the jackpot once. */
export const RESEARCH_GOAL = { wild: 3, elite: 3, boss: 2 };
export const RESEARCH_COINS = { wild: 50, elite: 100, boss: 200 };   // raised with the pages and the jackpot (the user's call, 2026-09-27)
export const DEX_COMPLETE_COINS = 1500;   // more than the three pages together (1200); the Scope Upgrade is left to grind for (the user's call)

/* The complete Pokédex's other prize (besides Reshiram): the Silph Scope, a button on the map that reveals who waits in a
   fight room of your choice, SCOPE_REVEALS a biome; the Game Corner's Scope Upgrade perk (`scopeUpgrade`) adds more. */
export const SCOPE = {
  id: 'silph-scope', name: 'Silph Scope', icon: '👀',
  text: 'Once per biome, reveal who waits in a fight room on the map, and their type.',
  short: 'Reveal a fight room on the map',
};
export const SCOPE_REVEALS = 1;

// Mewtwo's Crystal Depths stays a ??? tab (renderMystery() in js/pokedex.js) until v1.0 part D gives it a page and a perk,
// so dex.complete and its jackpot don't move.
export const DEX_PAGES = BIOMES.filter(b => !b.secret).map(b => ({
  biome: b.id,
  name: b.name,
  ids: [...b.normals, ...b.elites, ...b.bosses],
  role: Object.fromEntries([...b.normals.map(id => [id, 'wild']), ...b.elites.map(id => [id, 'elite']), ...b.bosses.map(id => [id, 'boss'])]),
  perk: DEX_PERKS[b.id],
}));

/** The Safari Zone opens once every entry has been beaten at least once (every page complete), not researched:
    3 defeats of each felt like a grind for a door (the user's call, 2026-10-02). */
export const safariOpen = (save) => save.safariPass || DEX_PAGES.every(p => save.dex.done.includes(p.biome));

/** Every entry in dex order, numbered from 1 like the games. */
export const DEX_NUMBER = Object.fromEntries(DEX_PAGES.flatMap(p => p.ids).map((id, i) => [id, i + 1]));
