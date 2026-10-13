/* ============================================================
   mart.js  -  Pokédollars (₽) and the Poké Mart map room.

   Pokédollars are prize money for the current run only (lost when it
   ends), unlike PokéCoins, which are kept forever (see shop.js).
   Every price gets a ±MART_JITTER wobble when a Mart's stock is rolled.
   ============================================================ */

// [min, max] prize money for winning each kind of fight.
export const PRIZE_MONEY = { fight: [12, 18], elite: [25, 35], boss: [65, 85] };

export const MART_CARD_PRICES = { common: 50, uncommon: 80, rare: 125 };
export const MART_RELIC_PRICES = { common: 140, uncommon: 180, rare: 230 };   // by the relic's rarity
export const MART_ITEM_PRICES = { common: 40, uncommon: 65, rare: 90 };
export const MART_JITTER = 0.1;

// Forgetting a move costs more each time you buy it in the same run.
export const MART_REMOVAL = { base: 50, step: 25 };

export const MART_STOCK = { cards: 5, items: 3, relics: 2 };

// Britt behind the counter (the user's friend, a Gym Leader off duty; LINC is her baby): a tap on her says the next talk, in turn.
export const BRITT_TALKS = [
  ['Welcome to the Poké Mart! Tap anything on the shelves to see it up close.'],
  ['Yes, I\'m a Gym Leader. No, I can\'t give you a badge from behind the till.', 'Off duty means off duty. Want a bag for that?'],
  ['A Gym Leader\'s pay? Ha!', 'Badges don\'t buy baby formula. Hence the second job.'],
  ['LINC drinks a bottle every three hours. Every. Three. Hours.', 'He eats like a baby Snorlax, and somebody has to pay for it.'],
  ['LINC is starting college in eighteen years.', 'Do you know what college costs? Every Potion you buy goes in his college fund.'],
  ['At my Gym, challengers tremble.', 'Here, they ask me where the Repels are. Aisle two, by the way.'],
  ['Don\'t tell my Gym trainers you saw me in this apron.', 'Or that there\'s baby spit-up on the shoulder.'],
  ['Diapers, wipes, a crib mobile of tiny Poké Balls...', 'So... can I interest you in a second relic?'],
  ['Battle me at the Gym and I won\'t hold back.', 'Battle me over prices here and I still won\'t hold back. No haggling!'],
  ['LINC said his first word today! I think it was "Pika".', 'Or he burped. Either way, I\'m proud.'],
  ['I haven\'t slept a full night since LINC was born.', 'Tougher than any Gym challenger, that baby.'],
  ['My Pokémon are babysitting LINC at the Gym today.', 'Me? I don\'t get rest days. Formula doesn\'t buy itself.'],
];
