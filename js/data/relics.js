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
  { id: 'bar-magnet',   name: 'Magnet',       icon: '🧲', rarity: 'common', only: 'electric', sprite: 'magnet', text: 'Your Electric attacks deal +2 damage.' },
  { id: 'never-melt-ice', name: 'Never-Melt Ice', icon: '🧊', rarity: 'common', only: 'ice', text: 'Your Ice attacks deal +2 damage.' },
  { id: 'expert-belt',  name: 'Expert Belt',  icon: '🥋', rarity: 'common', only: 'fighting', text: 'Your Fighting attacks deal +2 damage.' },   // Fighting's held item: Black Belt was taken (black-belt, the strength relic)
  { id: 'soft-sand',    name: 'Soft Sand',    icon: '⏳', rarity: 'common', only: 'ground', text: 'Your Ground attacks deal +2 damage.' },
  { id: 'sharp-beak',   name: 'Sharp Beak',   icon: '🐦', rarity: 'common', only: 'flying', text: 'Your Flying attacks deal +2 damage.' },

  { id: 'muscle-band',  name: 'Muscle Band',  icon: '💪', rarity: 'common', text: 'All your attacks deal +2 damage.' },
  { id: 'leftovers',    name: 'Leftovers',    icon: '🍙', rarity: 'uncommon', text: 'Heal 2 HP at the start of each of your turns.' },
  { id: 'shell-bell',   name: 'Shell Bell',   icon: '🔔', rarity: 'uncommon', text: 'Heal 1 HP each time you play an attack.' },
  { id: 'iron-plate',   name: 'Iron Plate',   icon: '🛡️', rarity: 'common', text: 'Start each battle with 8 block.' },
  { id: 'rocky-helmet', name: 'Rocky Helmet', icon: '⛑️', rarity: 'common', text: 'Enemies take 3 damage when they attack you.' },
  { id: 'scope-lens',   name: 'Scope Lens',   icon: '🔍', rarity: 'rare', text: 'Draw 1 extra card each turn.' },

  { id: 'focus-sash',   name: 'Focus Sash',   icon: '🎗️', rarity: 'rare', text: 'Once per battle, survive a fatal hit with 1 HP.' },

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
  { id: 'max-mushrooms',   name: 'Max Mushrooms',   icon: '🍄', boss: true,         only: 'grass', text: 'Draw 2 more cards each turn. Every card you draw gets a random cost from 0 to 3 PP.' },   // Snecko Eye
  { id: 'toxic-plate',     name: 'Toxic Plate',     icon: '☠️', rarity: 'uncommon', only: 'grass', text: 'Whenever you apply Vulnerable, also apply 1 Weak.' },   // Champion Belt

  // Water: Tsunami, Shell, Flow. Slowpoke Tail is Water's rule-changer.
  { id: 'blue-flute',      name: 'Blue Flute',      icon: '🌊', rarity: 'common',   only: 'water', text: 'Gain 1 Tide at the start of each of your turns.' },   // Damaru
  { id: 'lustrous-orb',    name: 'Lustrous Orb',    icon: '🔮', rarity: 'uncommon', only: 'water', text: 'Spending your Tide leaves half of it (rounded down) behind.' },   // (Tsunami's own)
  { id: 'eviolite',        name: 'Eviolite',        icon: '🛡️', rarity: 'common',   only: 'water', text: 'Start each of your turns with 3 block.' },   // Anchor, every turn
  { id: 'everstone',       name: 'Everstone',       icon: '🧱', rarity: 'rare',     only: 'water', text: 'Your block no longer vanishes at the start of your turn: it only drops by 10.' },   // Calipers
  { id: 'slowpoke-tail',   name: 'Slowpoke Tail',   icon: '🐚', boss: true,         only: 'water', text: 'At the end of your turn, you keep your hand instead of discarding it.' },   // Runic Pyramid
  { id: 'heart-scale',     name: 'Heart Scale',     icon: '💚', rarity: 'uncommon', only: 'water', text: 'Whenever you discard a card, gain 3 block.' },   // Tough Bandages

  // Any type.
  { id: 'casteliacone',     name: 'Casteliacone',     icon: '🥤', rarity: 'rare',     text: 'PP you don\'t spend is saved for your next turn.' },   // Ice Cream
  { id: 'magnet',           name: 'Quick Powder',     icon: '🧿', rarity: 'rare', sprite: 'quick-powder', text: 'Whenever your hand is empty on your turn, draw 1 card.' },   // Unceasing Top (was Magnet: Electric's held item took the name, 2026-10-19)
  { id: 'lum-berry',        name: 'Lum Berry',        icon: '🫐', rarity: 'uncommon', text: 'Status cards can be played for 0 PP. They exhaust and draw you a card.' },   // Medical Kit
  { id: 'strange-souvenir', name: 'Strange Souvenir', icon: '🧸', rarity: 'uncommon', text: 'At the start of each battle, add a random card of your type to your hand. It\'s free this turn.' },   // Toolbox
  { id: 'fist-plate',       name: 'Fist Plate',       icon: '🥊', rarity: 'uncommon', text: 'Every 3rd attack you play in a turn gives you 4 block.' },   // Ornamental Fan
  { id: 'dragon-fang',      name: 'Dragon Fang',      icon: '🦷', rarity: 'common',   text: 'Your first attack in each battle deals 10 more damage.' },   // Akabeko
  { id: 'big-malasada',     name: 'Big Malasada',     icon: '🍙', rarity: 'common',   text: 'Heal 15 HP whenever you walk into a Poké Mart.' },   // Meal Ticket
  { id: 'lemonade',         name: 'Lemonade',         icon: '🥤', rarity: 'common',   text: 'Gain 1 extra PP on your first turn of each battle.' },   // Lantern
  { id: 'stone-plate',      name: 'Stone Plate',      icon: '🧱', rarity: 'common',   text: 'At the start of your 2nd turn in each battle, gain 12 block.' },   // Horn Cleat

  // The 2026-10-16 balance pass: more of StS's relics, so a run meets about as many as a StS run does.
  { id: 'wide-lens',      name: 'Wide Lens',      icon: '🔍', rarity: 'common',   text: 'Enemies start each battle with 2 Vulnerable.' },   // Bag of Marbles (2: at 1 it only lasted turn 1, and measured below no relic)
  { id: 'lava-cookie',    name: 'Lava Cookie',    icon: '🍪', rarity: 'common',   text: 'Heal 3 HP at the start of each battle.' },   // Blood Vial
  { id: 'soothe-bell',    name: 'Soothe Bell',    icon: '🔔', rarity: 'common',   text: 'Every 3rd turn of a battle, gain 1 extra PP.' },   // Happy Flower
  { id: 'metal-coat',     name: 'Metal Coat',     icon: '🛡️', rarity: 'common',   text: 'Cards that give block give 1 more.' },   // Oddly Smooth Stone
  { id: 'rare-candy',     name: 'Rare Candy',     icon: '🍬', rarity: 'common',   text: 'When you pick this up, PP Up 2 random moves in your deck.' },   // War Paint + Whetstone
  { id: 'lucky-punch',    name: 'Lucky Punch',    icon: '🥊', rarity: 'common',   text: 'Every hit of your attacks deals at least 5 damage.' },   // The Boot
  { id: 'adrenaline-orb', name: 'Adrenaline Orb', icon: '🟢', rarity: 'common',   text: 'The first time you lose HP in each battle, draw 3 cards.' },   // Centennial Puzzle
  { id: 'moomoo-milk',    name: 'Moomoo Milk',    icon: '🥛', rarity: 'common',   text: 'Resting at a Pokémon Center heals 15 more HP.' },   // Regal Pillow
  { id: 'sticky-barb',    name: 'Sticky Barb',    icon: '🌵', rarity: 'uncommon', text: 'At the start of each of your turns, deal 3 damage to the enemy.' },   // Mercury Hourglass
  { id: 'lucky-egg',      name: 'Lucky Egg',      icon: '🥚', rarity: 'uncommon', text: 'Card rewards offer 1 more card.' },   // Question Card
  { id: 'power-bracer',   name: 'Power Bracer',   icon: '💪', rarity: 'uncommon', text: 'Attacks you add to your deck come PP Upped.' },   // Molten Egg
  { id: 'power-belt',     name: 'Power Belt',     icon: '🎽', rarity: 'rare',     text: 'Moves that aren\'t attacks come PP Upped when you add them to your deck.' },   // Frozen Egg + Toxic Egg (two of StS's uncommons in one, so rare)
  { id: 'razor-fang',     name: 'Razor Fang',     icon: '🦷', rarity: 'uncommon', text: 'Every 10th attack you play in a battle deals double damage.' },   // Pen Nib
  { id: 'spell-tag',      name: 'Spell Tag',      icon: '🏷️', rarity: 'uncommon', text: 'Every 3rd card that isn\'t an attack you play in a turn deals 5 damage to the enemy.' },   // Letter Opener
  { id: 'helix-fossil',   name: 'Helix Fossil',   icon: '🐚', rarity: 'rare',     text: 'The first time you would lose HP in each battle, you don\'t.' },   // Fossilized Helix
  { id: 'bright-powder',  name: 'Bright Powder',  icon: '✨', rarity: 'rare',     text: 'Every 6th turn of a battle, the enemy\'s attack misses you (Guard).' },   // Incense Burner
  // Electric's (the Safari's duo pool, docs/duo-design.md section 5: 6 a new type and its held item, the user's answer 21)
  { id: 'light-ball',      name: 'Light Ball',      icon: '💡', rarity: 'common',   only: 'electric', text: 'Enemies start each battle with 3 Static.' },   // Bag of Marbles, as Static (Gooey Mulch's)
  { id: 'eject-button',    name: 'Eject Button',    icon: '⏏️', rarity: 'common',   only: 'electric', text: 'Whenever you switch, gain 4 block.' },   // (Volt Switch's own: Wired as a relic)
  { id: 'zap-plate',       name: 'Zap Plate',       icon: '🟨', rarity: 'uncommon', only: 'electric', text: 'Whenever you play a card that costs 3 PP or more, gain 8 block.' },   // (Overcharge's own)
  { id: 'electirizer',     name: 'Electirizer',     icon: '🔌', rarity: 'uncommon', only: 'electric', text: 'Whenever the enemy is Paralyzed, draw 2 more cards next turn.' },   // (Static's own)
  { id: 'electric-memory', name: 'Electric Memory', icon: '💾', rarity: 'rare',     only: 'electric', text: 'When the enemy is Paralyzed, its Static drops by half, not to 0.' },   // (Static's own, Fire Memory's rarity)
  // Ice's (docs/duo-design.md section 5, "Ice's second session")
  { id: 'snowball',       name: 'Snowball',       icon: '⛄', rarity: 'common',   only: 'ice', text: 'Enemies start each battle with 3 Frostbite.' },   // Bag of Marbles, as Frostbite (Light Ball's shape)
  { id: 'safety-goggles', name: 'Safety Goggles', icon: '🥽', rarity: 'common',   only: 'ice', text: 'Whenever Hail hurts the enemy, gain 3 block.' },   // (Hail's own)
  { id: 'icy-rock',       name: 'Icy Rock',       icon: '🪨', rarity: 'uncommon', only: 'ice', text: 'Whenever a weather starts, it lasts 3 more turns.' },   // (the weather's own)
  { id: 'icicle-plate',   name: 'Icicle Plate',   icon: '🔷', rarity: 'uncommon', only: 'ice', text: 'Your Icicle cards start each battle dealing +4, as if 2 had been played.' },   // (Icicle's own)
  { id: 'ice-memory',     name: 'Ice Memory',     icon: '💾', rarity: 'rare',     only: 'ice', text: 'Frostbite doesn\'t thaw while Hail falls.' },   // (Frostbite and Hail's own, Electric Memory's rarity)
  // Fighting's (docs/duo-design.md section 5, "Fighting's second session")
  { id: 'ring-target',     name: 'Ring Target',     icon: '🎯', rarity: 'common',   only: 'fighting', text: 'Start each battle with Counter 8.' },   // Bag of Marbles, as Counter (Snowball's shape)
  { id: 'focus-band',      name: 'Focus Band',      icon: '🎗️', rarity: 'common',   only: 'fighting', text: 'Whenever a Follow-up happens, gain 3 block.' },   // (Follow-up's own)
  { id: 'protector',       name: 'Protector',       icon: '🛡️', rarity: 'uncommon', only: 'fighting', text: 'Whenever you gain Counter, gain 2 more.' },   // (Counter's own, Muscle Wing's shape)
  { id: 'weakness-policy', name: 'Weakness Policy', icon: '📜', rarity: 'uncommon', only: 'fighting', text: 'Whenever a status card is exhausted, gain 3 block.' },   // (Guts' own: Feel No Pain, on status cards)
  { id: 'fighting-memory', name: 'Fighting Memory', icon: '💾', rarity: 'rare',     only: 'fighting', text: 'At the start of your turn, your Counter halves instead of going away.' },   // (Counter's own, Electric Memory's rarity)
  // Ground's (docs/duo-design.md section 5, "Ground's second session")
  { id: 'earth-plate',   name: 'Earth Plate',   icon: '🟫', rarity: 'common',   only: 'ground', text: 'The enemy starts each battle with Fault 6.' },   // (Fault's own, Snowball's shape)
  { id: 'light-clay',    name: 'Light Clay',    icon: '🧱', rarity: 'common',   only: 'ground', text: 'Whenever you apply Fault, gain 2 block.' },   // (Fault's own)
  { id: 'shuca-berry',   name: 'Shuca Berry',   icon: '🫐', rarity: 'uncommon', only: 'ground', text: 'Whenever a card goes underground, gain 3 block.' },   // (Dig's own)
  { id: 'smooth-rock',   name: 'Smooth Rock',   icon: '🪨', rarity: 'uncommon', only: 'ground', text: 'Whenever a Sandstorm starts, it lasts 3 more turns.' },   // Icy Rock's, for Sandstorm
  { id: 'ground-memory', name: 'Ground Memory', icon: '💾', rarity: 'rare',     only: 'ground', text: 'Alphas and bosses count all their Fault, not half.' },   // (Fault's own, Electric Memory's rarity)
  // Flying's (docs/duo-design.md section 5, "Flying's second session")
  { id: 'sky-plate',     name: 'Sky Plate',     icon: '🟦', rarity: 'common',   only: 'flying', text: 'Start each battle with Tailwind 2.' },   // (Tailwind's own, Snowball's shape for you)
  { id: 'pretty-wing',   name: 'Pretty Wing',   icon: '🪶', rarity: 'common',   only: 'flying', text: 'Whenever you gain Evasion, gain 2 block.' },   // (Evasion's own, Light Clay's shape)
  { id: 'coba-berry',    name: 'Coba Berry',    icon: '🫐', rarity: 'uncommon', only: 'flying', text: 'Whenever an Unburden happens, gain 3 block.' },   // (Unburden's own, Focus Band's shape)
  { id: 'air-balloon',   name: 'Air Balloon',   icon: '🎈', rarity: 'uncommon', only: 'flying', text: 'Start each battle with Evasion 2.' },   // (Evasion's own)
  { id: 'flying-memory', name: 'Flying Memory', icon: '💾', rarity: 'rare',     only: 'flying', text: 'At the start of your turn, your Evasion halves instead of going away.' },   // (Evasion's own, Fighting Memory's shape)
  // a Duo Run's (docs/duo-design.md section 1): `duo` keeps it out of every other run
  { id: 'shed-shell',     name: 'Shed Shell',     icon: '🐚', rarity: 'uncommon', duo: true, text: 'Your first switch each turn is free.' },   // (the duo's own: StS has no switching)
  { id: 'sacred-ash',     name: 'Sacred Ash',     icon: '🕯️', rarity: 'rare',     text: 'Once this run, when you would faint, you come back with half your max HP.' },   // Lizard Tail
  { id: 'assault-vest',   name: 'Assault Vest',   icon: '🦺', rarity: 'rare',     text: 'Whenever an enemy hurts you, you lose 1 less HP.' },   // Tungsten Rod
  { id: 'protective-pads', name: 'Protective Pads', icon: '🧤', rarity: 'rare',   text: 'An enemy hit that would hurt you for 5 or less hurts you for 1.' },   // Torii
  { id: 'lagging-tail',   name: 'Lagging Tail',   icon: '🐾', rarity: 'rare',     text: 'If you play 3 or fewer cards in a turn, draw 3 more cards next turn.' },   // Pocketwatch
  { id: 'shiny-stone',    name: 'Shiny Stone',    icon: '💎', rarity: 'rare',     text: 'Whenever you play a power, heal 4 HP.' },   // Bird-Faced Urn
  // ...and one more per archetype for each type
  { id: 'kee-berry',      name: 'Kee Berry',      icon: '🫐', rarity: 'common',   only: 'fire',  text: 'Whenever you lose HP in battle, gain 3 block at the start of your next turn.' },   // Self-Forming Clay (Reckless)
  { id: 'fire-memory',    name: 'Fire Memory',    icon: '💿', rarity: 'uncommon', only: 'fire',  text: 'A burning enemy takes 25% more damage from your attacks.' },   // Paper Phrog, for Burn
  { id: 'soot-sack',      name: 'Soot Sack',      icon: '👝', rarity: 'uncommon', only: 'fire',  text: 'The first time a card exhausts each turn, gain 1 PP.' },   // (Kindling's own)
  { id: 'macho-brace',    name: 'Macho Brace',    icon: '🏋️', rarity: 'uncommon', only: 'grass', text: 'Start Alpha and boss battles with 3 strength.' },   // Sling of Courage (Growth)
  { id: 'luminous-moss',  name: 'Luminous Moss',  icon: '🌿', rarity: 'common',   only: 'grass', text: 'Whenever you heal in battle, gain 2 block.' },   // (Drain's own)
  { id: 'sachet',         name: 'Sachet',         icon: '👛', rarity: 'common',   only: 'grass', text: 'Enemies start each battle with 2 Weak.' },   // Bag of Marbles, as Weak (Spores)
  { id: 'splash-plate',   name: 'Splash Plate',   icon: '💧', rarity: 'uncommon', only: 'water', text: 'The first time you spend Tide each turn, draw 2 cards.' },   // (Tsunami's own)
  { id: 'big-pearl',      name: 'Big Pearl',      icon: '⚪', rarity: 'common',   only: 'water', text: 'When your block stops an enemy attack completely, gain 2 Tide.' },   // (Shell's own)
  { id: 'tidal-bell',     name: 'Tidal Bell',     icon: '🔔', rarity: 'rare',     only: 'water', text: 'Whenever you discard a card, deal 3 damage to the enemy.' },   // Tingsha (Flow)

  // Boss relics: only offered after a boss. The energy ones have a catch; the others upgrade your Ability (StS's Black
  // Blood, Ring of the Serpent...) or bend a run's rules (Snecko Eye, Runic Pyramid, Black Star).
  { id: 'choice-band',  name: 'Choice Band',  icon: '🎀', boss: true, text: 'Gain 1 extra PP every turn. You can no longer Rest at Pokémon Centers.' },
  { id: 'choice-specs', name: 'Choice Specs', icon: '👓', boss: true, text: 'Gain 1 extra PP every turn. Draw 1 fewer card each turn.' },
  { id: 'toxic-orb',    name: 'Toxic Orb',    icon: '☠️', boss: true, text: 'Gain 1 extra PP every turn. Lose 1 HP at the start of each of your turns (never below 1).' },
  { id: 'room-service',  name: 'Room Service',  icon: '🔔', boss: true, text: 'Gain 1 extra PP every turn. You can play at most 6 cards a turn.' },   // Velvet Choker
  { id: 'griseous-orb',  name: 'Griseous Orb',  icon: '🔮', boss: true, text: 'Gain 1 extra PP every turn. Every battle starts with 2 Sludge shuffled into your draw pile.' },   // Mark of Pain (was Philosopher's Stone: enemies +2 strength)
  { id: 'choice-scarf', name: 'Choice Scarf', icon: '🧣', boss: true, text: 'Gain 1 extra PP every turn. Your moves are locked in: Chansey can no longer PP Up them at Pokémon Centers.' },   // Fusion Hammer (was a rare with no catch: the bot's best relic for every type, 2026-10-16)
  { id: 'dusk-stone',    name: 'Dusk Stone',    icon: '💎', boss: true, text: 'Gain 1 extra PP every turn. You can\'t get any more items (you keep the ones in your Bag).' },   // Sozu (was Runic Dome: hid the enemy's intent, the user disliked it)

  { id: 'magmarizer',   name: 'Magmarizer',   icon: '🌋', boss: true, only: 'fire',  text: 'Blaze is always on, not just below half HP.' },   // Black Blood
  { id: 'leaf-stone',   name: 'Leaf Stone',   icon: '🍃', boss: true, only: 'grass', text: 'Overgrow heals 10 HP after each fight you win, not 3.' },   // Black Blood
  { id: 'water-stone',  name: 'Water Stone',  icon: '💧', boss: true, only: 'water', text: 'Draw 1 extra card each turn. Torrent starts each fight with 4 Tide, not 2.' },   // Ring of the Serpent
  { id: 'ice-stone',    name: 'Ice Stone',    icon: '❄️', boss: true, only: 'ice', text: 'Draw 1 extra card each turn. Snow Warning brings 4 turns of Hail, not 2.' },   // Ring of the Serpent, Water Stone's shape
  { id: 'fightinium-z', name: 'Fightinium Z', icon: '💎', boss: true, only: 'fighting', text: 'Draw 1 extra card each turn. Guts gives +6, not +3.' },   // Ring of the Serpent, Water Stone's shape (Fighting has no stone)
  { id: 'groundium-z',  name: 'Groundium Z',  icon: '💎', boss: true, only: 'ground', text: 'Draw 1 extra card each turn. Sturdy saves you twice a fight, not once.' },   // Ring of the Serpent, Water Stone's shape (Ground has no stone)
  { id: 'flyinium-z',   name: 'Flyinium Z',   icon: '💎', boss: true, only: 'flying', text: 'Draw 1 extra card each turn. Keen Eye draws 2, not 1.' },   // Ring of the Serpent, Water Stone's shape (Flying has no stone)
  { id: 'thunder-stone', name: 'Thunder Stone', icon: '⚡', boss: true, only: 'electric', text: 'Draw 1 extra card each turn. Static charges the enemy 4, not 2.' },   // Ring of the Serpent, Water Stone's shape
  { id: 'shiny-charm',  name: 'Shiny Charm',  icon: '🌟', boss: true, text: 'Alphas give 2 relics to choose from, one after the other.' },   // Black Star

  // `unique`: never offered anywhere; only won by beating Chad Master Kenmatta in his dojo (the Move Tutor event)
  { id: 'exp-share', name: 'Mata-Mindset', icon: '🎓', unique: true, text: 'Gain 1 extra PP and draw 1 extra card every turn. Start each battle with 1 strength.' },
  // `event`: unique too, but found in a ? room (the Ruins Idol), listed in the Index under its own heading
  { id: 'relic-statue', name: 'Relic Statue', icon: '🗿', unique: true, event: 'ruins-idol', text: 'Win 25% more prize money (₽) after fights.' },   // Golden Idol
];

/** The prize money (₽) a fight pays is multiplied by this: Amulet Coin doubles it, the Relic Statue adds a quarter. */
export const prizeMult = (relics) => (relics.includes('amulet-coin') ? 2 : 1) * (relics.includes('relic-statue') ? 1.25 : 1);

/** Boss relics that give +1 energy every turn (Choice Band and the rest). */
export const ENERGY_RELICS = ['choice-band', 'choice-specs', 'choice-scarf', 'toxic-orb', 'room-service', 'griseous-orb', 'dusk-stone'];

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
    says(/Static/) && term('Static'),
    says(/Paralyzed/) && term('Paralyzed'),
    says(/\bswitch/i) && term('Switch'),
    says(/Frostbite/) && term('Frostbite'),
    says(/Hail|weather/) && term('Hail'),
    says(/Icicle/) && term('Icicle'),
    says(/Counter/) && term('Counter'),
    says(/Follow-up/) && term('Follow-up'),
    says(/status card/) && ['Status cards', 'Junk in your deck for this fight: Sore, and what enemies add.'],
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
  electric: { id: 'static', name: 'Static', icon: '⚡', sprite: 'ability-capsule', amount: 2, text: 'Each time the enemy attacks you, it gains 2 Static.' },
  ice: { id: 'snow-warning', name: 'Snow Warning', icon: '🌨️', sprite: 'ability-capsule', amount: 2, text: 'Start each fight in Hail for 2 turns.' },
  fighting: { id: 'guts', name: 'Guts', icon: '💢', sprite: 'ability-capsule', amount: 3, text: 'While a status card is in your hand, your attacks deal +3 damage.' },
  flying: { id: 'keen-eye', name: 'Keen Eye', icon: '🦅', sprite: 'ability-capsule', amount: 1, text: 'When it comes out, the fight\'s start too, draw 1 card (once a turn).' },
  ground: { id: 'sturdy', name: 'Sturdy', icon: '⛰️', sprite: 'ability-capsule', amount: 1, text: 'Once a fight, a hit that would knock you out leaves you at 1 HP.' },
};
