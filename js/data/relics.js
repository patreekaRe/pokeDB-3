/* ============================================================
   relics.js  -  held items that give you a permanent bonus for
   the rest of the run. You find them from elite fights, bosses,
   treasure rooms, the Poké Mart and some ? events.

   The effects are applied in battle.js (search for `hasRelic`).
   `only` means the relic only shows up for starters of that type.
   `rarity` is StS's relic tier ('common' / 'uncommon' / 'rare'): each
   relic offered rolls a tier by RELIC_ODDS in rewards.js (elites and
   treasure lean rarer), and the Mart prices it by tier.
   `boss` relics are only offered after a boss (and nowhere else).
   Every relic's art is assets/items/<id>.png (PokéSprite), and each
   new one is modelled on a Slay the Spire relic (named in a comment).
   ============================================================ */

import { term } from './cards.js';

export const RELICS = [
  { id: 'charcoal',     name: 'Charcoal',     icon: '⚫', rarity: 'common', only: 'fire',  text: 'Your Fire attacks deal +2 damage.' },
  { id: 'miracle-seed', name: 'Miracle Seed', icon: '🌱', rarity: 'common', only: 'grass', text: 'Your Grass attacks deal +2 damage.' },
  { id: 'mystic-water', name: 'Mystic Water', icon: '💧', rarity: 'common', only: 'water', text: 'Your Water attacks deal +2 damage.' },

  { id: 'muscle-band',  name: 'Muscle Band',  icon: '💪', rarity: 'common', text: 'All your attacks deal +2 damage.' },
  { id: 'leftovers',    name: 'Leftovers',    icon: '🍙', rarity: 'uncommon', text: 'Heal 2 HP at the start of each of your turns.' },
  { id: 'shell-bell',   name: 'Shell Bell',   icon: '🔔', rarity: 'uncommon', text: 'Heal 1 HP each time you play an attack.' },
  { id: 'iron-plate',   name: 'Iron Plate',   icon: '🛡️', rarity: 'common', text: 'Start each battle with 8 block.' },
  { id: 'rocky-helmet', name: 'Rocky Helmet', icon: '⛑️', rarity: 'common', text: 'Enemies take 3 damage when they attack you.' },
  { id: 'scope-lens',   name: 'Scope Lens',   icon: '🔍', rarity: 'rare', text: 'Draw 1 extra card each turn.' },

  { id: 'focus-sash',   name: 'Focus Sash',   icon: '🎗️', rarity: 'rare', text: 'Once per battle, survive a fatal hit with 1 HP.' },
  { id: 'choice-scarf', name: 'Choice Scarf', icon: '🧣', rarity: 'rare', text: 'Gain 1 extra PP every turn.' },

  { id: 'black-belt',   name: 'Black Belt',   icon: '🥋', rarity: 'common', text: 'Start each battle with 1 strength.' },
  { id: 'quick-claw',   name: 'Quick Claw',   icon: '🐾', rarity: 'common', text: 'Draw 2 extra cards on your first turn.' },
  { id: 'cleanse-tag',  name: 'Cleanse Tag',  icon: '🏷️', rarity: 'common', text: 'When you pick this up, forget a move from your deck.' },
  { id: 'mental-herb',  name: 'Mental Herb',  icon: '🍃', rarity: 'rare', text: 'At a Pokémon Center, the PC can also forget a move from your deck.' },   // Peace Pipe
  { id: 'power-herb',   name: 'Power Herb',   icon: '🌿', rarity: 'uncommon', text: 'Draw 1 card whenever you play a power.' },
  { id: 'grip-claw',    name: 'Grip Claw',    icon: '🦀', rarity: 'uncommon', text: 'At the end of your turn, the card furthest left in your hand stays there for next turn.' },
  { id: 'eject-pack',   name: 'Eject Pack',   icon: '🎒', rarity: 'uncommon', text: 'Draw 1 card whenever a card exhausts.' },
  { id: 'amulet-coin',  name: 'Amulet Coin',  icon: '🪙', rarity: 'uncommon', text: 'Win double prize money (₽) after fights.' },

  { id: 'flame-orb',    name: 'Flame Orb',    icon: '🔥', rarity: 'common', only: 'fire',  text: 'Enemies start each battle with 3 burn.' },
  { id: 'heat-rock',    name: 'Heat Rock',    icon: '♨️', rarity: 'uncommon', only: 'fire',  text: 'Heal 2 HP each time burn hurts an enemy.' },
  { id: 'big-root',     name: 'Big Root',     icon: '🌳', rarity: 'uncommon', only: 'grass', text: 'Healing from your cards and powers restores 2 more HP.' },
  { id: 'grassy-seed',  name: 'Grassy Seed',  icon: '🍀', rarity: 'common', only: 'grass', text: 'Gain 1 strength every 3rd turn.' },
  { id: 'damp-rock',    name: 'Damp Rock',    icon: '🌧️', rarity: 'common', only: 'water', text: 'Cards that give block give 2 more.' },
  { id: 'wave-incense', name: 'Wave Incense', icon: '🌊', rarity: 'uncommon', only: 'water', text: 'When your block stops an enemy attack completely, deal 5 damage back.' },

  // Fire: two per archetype (Burn, Reckless, Kindling). Dawn Stone is Fire's rule-changer.
  { id: 'tamato-berry',    name: 'Tamato Berry',    icon: '🫐', rarity: 'common',   only: 'fire',  text: 'Every Burn your cards and powers apply is 2 higher.' },   // Snecko Skull
  { id: 'spelon-berry',    name: 'Spelon Berry',    icon: '♨️', rarity: 'rare',     only: 'fire',  text: 'At the start of your turn, a burning enemy takes half its Burn as damage (its Burn doesn\'t drop).' },   // (Burn's own Catalyst)
  { id: 'black-sludge',    name: 'Black Sludge',    icon: '🟣', rarity: 'uncommon', only: 'fire',  text: 'Your attacks deal +3 damage. The first attack you play each turn costs you 1 HP.' },   // Red Skull / Brimstone
  { id: 'salac-berry',     name: 'Salac Berry',     icon: '🫐', rarity: 'uncommon', only: 'fire',  text: 'Whenever you lose HP, draw 1 card.' },   // Runic Cube
  { id: 'dawn-stone',      name: 'Dawn Stone',      icon: '💎', rarity: 'rare',     only: 'fire',  text: 'Whenever a card exhausts, add a random Fire card to your hand.' },   // Dead Branch
  { id: 'smoke-poke-tail', name: 'Smoke-Poke Tail', icon: '💨', rarity: 'common'  , only: 'fire',  text: 'Whenever a card exhausts, deal 4 damage to the enemy.' },   // Charon's Ashes

  // Grass: Growth, Drain, Spores. Max Mushrooms is Grass's rule-changer.
  { id: 'protein',         name: 'Protein',         icon: '💪', rarity: 'common',   only: 'grass', text: 'Every 3rd attack you play in a turn gives you 1 strength.' },   // Shuriken
  { id: 'muscle-wing',     name: 'Muscle Wing',     icon: '💪', rarity: 'uncommon', only: 'grass', text: 'Whenever you gain strength, gain 1 more.' },   // Snecko Skull, for strength
  { id: 'gooey-mulch',     name: 'Gooey Mulch',     icon: '🌱', rarity: 'common',   only: 'grass', text: 'Enemies start each battle with 2 Leech Seed.' },   // Twisted Funnel
  { id: 'enigma-berry',    name: 'Enigma Berry',    icon: '🫐', rarity: 'rare',     only: 'grass', text: 'Whenever you heal in battle, the enemy takes that much damage.' },   // (Drain's payoff)
  { id: 'max-mushrooms',   name: 'Max Mushrooms',   icon: '🍄', rarity: 'rare',     only: 'grass', text: 'Draw 2 more cards each turn. Every card you draw gets a random cost from 0 to 3 PP.' },   // Snecko Eye
  { id: 'toxic-plate',     name: 'Toxic Plate',     icon: '☠️', rarity: 'uncommon', only: 'grass', text: 'Whenever you apply Vulnerable, also apply 1 Weak.' },   // Champion Belt

  // Water: Tsunami, Shell, Flow. Slowpoke Tail is Water's rule-changer.
  { id: 'blue-flute',      name: 'Blue Flute',      icon: '🌊', rarity: 'common',   only: 'water', text: 'Gain 1 Tide at the start of each of your turns.' },   // Damaru
  { id: 'lustrous-orb',    name: 'Lustrous Orb',    icon: '🔮', rarity: 'uncommon', only: 'water', text: 'Spending your Tide leaves half of it (rounded down) behind.' },   // (Tsunami's own)
  { id: 'eviolite',        name: 'Eviolite',        icon: '🛡️', rarity: 'common',   only: 'water', text: 'Start each of your turns with 3 block.' },   // Anchor, every turn
  { id: 'everstone',       name: 'Everstone',       icon: '🧱', rarity: 'rare',     only: 'water', text: 'Your block no longer vanishes at the start of your turn: it only drops by 10.' },   // Calipers
  { id: 'slowpoke-tail',   name: 'Slowpoke Tail',   icon: '🐚', rarity: 'rare',     only: 'water', text: 'At the end of your turn, you keep your hand instead of discarding it.' },   // Runic Pyramid
  { id: 'heart-scale',     name: 'Heart Scale',     icon: '💚', rarity: 'uncommon', only: 'water', text: 'Whenever you discard a card, gain 3 block.' },   // Tough Bandages

  // Any type.
  { id: 'casteliacone',     name: 'Casteliacone',     icon: '🥤', rarity: 'rare',     text: 'PP you don\'t spend is saved for your next turn.' },   // Ice Cream
  { id: 'magnet',           name: 'Magnet',           icon: '🧿', rarity: 'rare',     text: 'Whenever your hand is empty on your turn, draw 1 card.' },   // Unceasing Top
  { id: 'lum-berry',        name: 'Lum Berry',        icon: '🫐', rarity: 'uncommon', text: 'Status cards can be played for 0 PP. They exhaust and draw you a card.' },   // Medical Kit
  { id: 'strange-souvenir', name: 'Strange Souvenir', icon: '🧸', rarity: 'uncommon', text: 'At the start of each battle, add a random card of your type to your hand. It\'s free this turn.' },   // Toolbox
  { id: 'fist-plate',       name: 'Fist Plate',       icon: '🥊', rarity: 'uncommon', text: 'Every 3rd attack you play in a turn gives you 4 block.' },   // Ornamental Fan
  { id: 'dragon-fang',      name: 'Dragon Fang',      icon: '🦷', rarity: 'common',   text: 'Your first attack in each battle deals 10 more damage.' },   // Akabeko
  { id: 'big-malasada',     name: 'Big Malasada',     icon: '🍙', rarity: 'common',   text: 'Heal 15 HP whenever you walk into a Poké Mart.' },   // Meal Ticket
  { id: 'lemonade',         name: 'Lemonade',         icon: '🥤', rarity: 'common',   text: 'Gain 1 extra PP on your first turn of each battle.' },   // Lantern
  { id: 'stone-plate',      name: 'Stone Plate',      icon: '🧱', rarity: 'common',   text: 'At the start of your 2nd turn in each battle, gain 12 block.' },   // Horn Cleat

  // Boss relics: only offered after a boss, and every one has a catch.
  { id: 'choice-band',  name: 'Choice Band',  icon: '🎀', boss: true, text: 'Gain 1 extra PP every turn. You can no longer Rest at Pokémon Centers.' },
  { id: 'choice-specs', name: 'Choice Specs', icon: '👓', boss: true, text: 'Gain 1 extra PP every turn. Draw 1 fewer card each turn.' },
  { id: 'toxic-orb',    name: 'Toxic Orb',    icon: '☠️', boss: true, text: 'Gain 1 extra PP every turn. Lose 1 HP at the start of each of your turns (never below 1).' },
  { id: 'room-service',  name: 'Room Service',  icon: '🔔', boss: true, text: 'Gain 1 extra PP every turn. You can play at most 6 cards a turn.' },   // Velvet Choker
  { id: 'griseous-orb',  name: 'Griseous Orb',  icon: '🔮', boss: true, text: 'Gain 1 extra PP every turn. Every battle starts with 2 Sludge shuffled into your draw pile.' },   // Mark of Pain (was Philosopher's Stone: enemies +2 strength)
  { id: 'dusk-stone',    name: 'Dusk Stone',    icon: '💎', boss: true, text: 'Gain 1 extra PP every turn. You can\'t get any more items (you keep the ones in your Bag).' },   // Sozu (was Runic Dome: hid the enemy's intent, the user disliked it)
];

/** Boss relics that give +1 energy every turn (Choice Band and the rest). */
export const ENERGY_RELICS = ['choice-band', 'choice-specs', 'toxic-orb', 'room-service', 'griseous-orb', 'dusk-stone'];

export const RELICS_BY_ID = Object.fromEntries(RELICS.map(r => [r.id, r]));

/** Keyword boxes for a relic (or Ability), found in its text: the same words the cards' boxes use. */
export function relicTerms(relic) {
  const says = (re) => re.test(relic.text);
  return [
    says(/exhaust/i) && term('Exhaust'),
    says(/\bdiscard\b/i) && term('Discard'),   // not Slowpoke Tail's "instead of discarding": that one is the turn's end
    says(/\bpower\b/i) && ['Power', 'A card that lasts all fight once played.'],
    says(/Tide/) && term('Tide'),
    says(/burn/i) && term('Burn'),
    says(/Leech Seed/) && term('Leech Seed'),
    says(/\bWeak\b/) && term('Weak'),
    says(/Vulnerable/) && term('Vulnerable'),
    says(/strength/i) && term('Strength'),
    says(/Focus/) && term('Focus'),
    says(/Status cards/) && ['Status cards', 'Junk enemies put in your deck, for this fight only.'],
    says(/Sludge/) && ['Sludge', 'Junk: costs 1 PP, does nothing, then exhausts.'],
  ].filter(Boolean);
}

/* Each character's starter Ability (StS's starter relics: Burning Blood, Ring of the Snake...). It comes from the
   starter's type, so every skin shares it, and it isn't stored in the run save. The effects are in battle.js
   (search for `ability`); `amount` is the number in the text. */
export const ABILITIES = {
  fire:  { id: 'blaze',    name: 'Blaze',    icon: '🔥', sprite: 'ability-capsule', amount: 3, text: 'While your HP is below half, your attacks deal +3 damage.' },
  grass: { id: 'overgrow', name: 'Overgrow', icon: '🌿', sprite: 'ability-capsule', amount: 3, text: 'After each fight you win, heal 3 HP.' },
  water: { id: 'torrent',  name: 'Torrent',  icon: '🌊', sprite: 'ability-capsule', amount: 2, text: 'Start each fight with 2 Tide.' },
  psychic: { id: 'pressure', name: 'Pressure', icon: '🔮', sprite: 'ability-capsule', amount: 2, text: 'Start each fight with 2 Focus: your next attack deals +2 damage.' },
};
