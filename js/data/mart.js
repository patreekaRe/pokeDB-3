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

// Britt behind the counter (the user's friend, a Gym Leader off duty): a tap on her says the next talk, in turn.
export const BRITT_TALKS = [
  ['Welcome to the Poké Mart! Tap anything on the shelves to see it up close.'],
  ['Yes, I\'m a Gym Leader. No, I can\'t give you a badge from behind the till.', 'Off duty means off duty. Want a bag for that?'],
  ['A Gym Leader\'s pay? Ha!', 'Badges don\'t buy groceries. Hence the second job.'],
  ['LINC eats like a Snorlax. Every. Single. Day.', 'Somebody has to pay for all those Berries, and it\'s me.'],
  ['LINC wants to go to college.', 'Do you know what college costs? Every Potion you buy is a textbook for him.'],
  ['At my Gym, challengers tremble.', 'Here, they ask me where the Repels are. Aisle two, by the way.'],
  ['Don\'t tell my Gym trainers you saw me in this apron.', 'I have a reputation to keep.'],
  ['I\'m saving up for LINC\'s tuition one sale at a time.', 'So... can I interest you in a second relic?'],
  ['Battle me at the Gym and I won\'t hold back.', 'Battle me over prices here and I still won\'t hold back. No haggling!'],
  ['LINC called again. He needs new shoes AND a lab fee.', 'Double shifts it is.'],
  ['When LINC graduates, I\'m framing his diploma next to my badge case.', 'Until then: thank you for shopping!'],
  ['My Pokémon are resting at the Gym today.', 'Me? I don\'t get rest days. LINC\'s meal plan doesn\'t pay itself.'],
];
