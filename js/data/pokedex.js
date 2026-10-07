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

import { BIOMES, ALT_BIOMES } from './enemies.js';

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

// Mewtwo's Crystal Depths has a page of its own (DEPTHS_PAGE, below), never in DEX_PAGES: only Mewtwo reaches it, so the
// whole-dex jackpot, Reshiram and the Safari Zone's door must not wait on it.
const pageFor = (b) => ({
  biome: b.id,
  name: b.name,
  ids: [...b.normals, ...b.elites, ...b.bosses],
  role: Object.fromEntries([...b.normals.map(id => [id, 'wild']), ...b.elites.map(id => [id, 'elite']), ...b.bosses.map(id => [id, 'boss'])]),
});

export const DEX_PAGES = BIOMES.filter(b => !b.secret).map(b => ({ ...pageFor(b), perk: DEX_PERKS[b.id] }));

/** The Crystal Depths' page (v1.0 part D, the user's pick): a "???" tab until a Mewtwo run reaches it. Beating all 16 once
    unlocks shiny Mewtwo, which can't be bought (FEATS in achievements.js grants it). */
export const DEPTHS_PAGE = { ...pageFor(BIOMES.find(b => b.secret)), prize: { icon: '✨', name: 'Shiny Mewtwo', text: 'Mewtwo in its shiny colours. It can\'t be bought.' } };
/** The other roads' pages (roadmap item 19, the user's call): bonus pages, never in DEX_PAGES, so finishing the Pokédex,
    Reshiram and the Safari Zone don't wait on a road a run may never take. Each pays its `bonus` PokéCoins once, and is
    "???" in the Pokédex until one of its Pokémon has been met. */
export const BONUS_COINS = { ruins: 500, thornwood: 500 };
const BONUS_ICON = { ruins: '🏛️', thornwood: '🌴' };
export const BONUS_PAGES = ALT_BIOMES.map(b => ({ ...pageFor(b), bonus: { icon: BONUS_ICON[b.id], coins: BONUS_COINS[b.id] } }));
/** Every page the Pokédex window shows: the three, the Depths, then the bonus pages (indices stay put as pages are added). */
export const ALL_PAGES = [...DEX_PAGES, DEPTHS_PAGE, ...BONUS_PAGES];
/** A biome's page number in ALL_PAGES (-1 if it has none). */
export const pageIndexOf = (biomeId) => ALL_PAGES.findIndex(p => p.biome === biomeId);

/** The Safari Zone opens once every entry has been beaten at least once (every page complete), not researched:
    3 defeats of each felt like a grind for a door (the user's call, 2026-10-02). */
export const safariOpen = (save) => save.safariPass || DEX_PAGES.every(p => save.dex.done.includes(p.biome));

/** How far along the Safari Zone's unlock is: "12/48", Pokémon beaten over every entry in the three biomes. */
export function safariUnlockProgress(save) {
  const ids = DEX_PAGES.flatMap(p => p.ids);
  const beaten = new Set(save.dex.defeated);
  return `${ids.filter(id => beaten.has(id)).length}/${ids.length}`;
}

/** Every entry in dex order, numbered from 1 like the games. */
export const DEX_NUMBER = Object.fromEntries(ALL_PAGES.flatMap(p => p.ids).map((id, i) => [id, i + 1]));
