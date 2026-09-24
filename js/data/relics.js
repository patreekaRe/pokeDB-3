/* ============================================================
   relics.js  -  held items that give you a permanent bonus for
   the rest of the run. You find them from elite fights, bosses
   and treasure rooms.

   The effects are applied in battle.js (search for `hasRelic`).
   `only` means the relic only shows up for starters of that type.
   `rare` relics only drop from elites, bosses and treasure rooms.
   `boss` relics are only offered after a boss (and nowhere else).
   ============================================================ */

export const RELICS = [
  { id: 'charcoal',     name: 'Charcoal',     icon: '⚫', only: 'fire',  text: 'Your Fire attacks deal +2 damage.' },
  { id: 'miracle-seed', name: 'Miracle Seed', icon: '🌱', only: 'grass', text: 'Your Grass attacks deal +2 damage.' },
  { id: 'mystic-water', name: 'Mystic Water', icon: '💧', only: 'water', text: 'Your Water attacks deal +2 damage.' },

  { id: 'muscle-band',  name: 'Muscle Band',  icon: '💪', text: 'All your attacks deal +2 damage.' },
  { id: 'leftovers',    name: 'Leftovers',    icon: '🍙', text: 'Heal 2 HP at the start of each of your turns.' },
  { id: 'shell-bell',   name: 'Shell Bell',   icon: '🔔', text: 'Heal 1 HP each time you play an attack.' },
  { id: 'iron-plate',   name: 'Iron Plate',   icon: '🛡️', text: 'Start each battle with 8 block.' },
  { id: 'rocky-helmet', name: 'Rocky Helmet', icon: '⛑️', text: 'Enemies take 3 damage when they attack you.' },
  { id: 'scope-lens',   name: 'Scope Lens',   icon: '🔍', text: 'Draw 1 extra card each turn.' },

  { id: 'focus-sash',   name: 'Focus Sash',   icon: '🎗️', rare: true, text: 'Once per battle, survive a fatal hit with 1 HP.' },
  { id: 'choice-scarf', name: 'Choice Scarf', icon: '🧣', rare: true, text: 'Gain +1 energy every turn.' },

  { id: 'black-belt',   name: 'Black Belt',   icon: '🥋', text: 'Start each battle with 1 strength.' },
  { id: 'quick-claw',   name: 'Quick Claw',   icon: '🐾', text: 'Draw 2 extra cards on your first turn.' },
  { id: 'cleanse-tag',  name: 'Cleanse Tag',  icon: '🏷️', text: 'When you pick this up, forget a move from your deck.' },
  { id: 'power-herb',   name: 'Power Herb',   icon: '🌿', text: 'Draw 1 card whenever you play a power.' },
  { id: 'grip-claw',    name: 'Grip Claw',    icon: '🦀', text: 'At the end of your turn, your leftmost card stays in your hand.' },
  { id: 'eject-pack',   name: 'Eject Pack',   icon: '🎒', text: 'Draw 1 card whenever a card exhausts.' },
  { id: 'amulet-coin',  name: 'Amulet Coin',  icon: '🪙', text: 'Win double prize money (₽) after fights.' },

  { id: 'flame-orb',    name: 'Flame Orb',    icon: '🔥', only: 'fire',  text: 'Enemies start each battle with 3 burn.' },
  { id: 'heat-rock',    name: 'Heat Rock',    icon: '♨️', only: 'fire',  text: 'Heal 1 HP each time burn hurts an enemy.' },
  { id: 'big-root',     name: 'Big Root',     icon: '🌳', only: 'grass', text: 'Healing from your cards and powers restores 2 more HP.' },
  { id: 'grassy-seed',  name: 'Grassy Seed',  icon: '🍀', only: 'grass', text: 'Gain 1 strength every 3rd turn.' },
  { id: 'damp-rock',    name: 'Damp Rock',    icon: '🌧️', only: 'water', text: 'Cards that give block give 2 more.' },
  { id: 'wave-incense', name: 'Wave Incense', icon: '🌊', only: 'water', text: 'When your block stops an enemy attack completely, deal 5 damage back.' },

  // Boss relics: only offered after a boss, and every one has a catch.
  { id: 'choice-band',  name: 'Choice Band',  icon: '🎀', boss: true, text: 'Gain +1 energy every turn. You can no longer Rest at Pokémon Centers.' },
  { id: 'choice-specs', name: 'Choice Specs', icon: '👓', boss: true, text: 'Gain +1 energy every turn. Draw 1 fewer card each turn.' },
  { id: 'toxic-orb',    name: 'Toxic Orb',    icon: '☠️', boss: true, text: 'Gain +1 energy every turn. Lose 1 HP at the start of each turn (never below 1).' },
];

export const RELICS_BY_ID = Object.fromEntries(RELICS.map(r => [r.id, r]));
