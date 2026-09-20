/* ============================================================
   relics.js  -  held items that give you a permanent bonus for
   the rest of the run. You find them from elite fights, bosses
   and treasure rooms.

   The effects are applied in battle.js (search for `hasRelic`).
   `only` means the relic only shows up for starters of that type.
   `rare` relics only drop from elites, bosses and treasure rooms.
   ============================================================ */

export const RELICS = [
  { id: 'charcoal',     name: 'Charcoal',     icon: '⚫', only: 'fire',  text: 'Your Fire attacks deal +2 damage.' },
  { id: 'miracle-seed', name: 'Miracle Seed', icon: '🌱', only: 'grass', text: 'Your Grass attacks deal +2 damage.' },
  { id: 'mystic-water', name: 'Mystic Water', icon: '💧', only: 'water', text: 'Your Water attacks deal +2 damage.' },

  { id: 'muscle-band',  name: 'Muscle Band',  icon: '💪', text: 'All your attacks deal +2 damage.' },
  { id: 'leftovers',    name: 'Leftovers',    icon: '🍙', text: 'Heal 3 HP at the start of each of your turns.' },
  { id: 'shell-bell',   name: 'Shell Bell',   icon: '🔔', text: 'Heal 2 HP each time you play an attack.' },
  { id: 'iron-plate',   name: 'Iron Plate',   icon: '🛡️', text: 'Start each battle with 8 block.' },
  { id: 'rocky-helmet', name: 'Rocky Helmet', icon: '⛑️', text: 'Enemies take 3 damage when they attack you.' },
  { id: 'scope-lens',   name: 'Scope Lens',   icon: '🔍', text: 'Draw 1 extra card each turn.' },

  { id: 'focus-sash',   name: 'Focus Sash',   icon: '🎗️', rare: true, text: 'Once per battle, survive a fatal hit with 1 HP.' },
  { id: 'choice-scarf', name: 'Choice Scarf', icon: '🧣', rare: true, text: 'Gain +1 energy every turn.' },
];

export const RELICS_BY_ID = Object.fromEntries(RELICS.map(r => [r.id, r]));
