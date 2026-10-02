/* ============================================================
   safari-mons.js  -  the Safari Zone's own Pokémon (roadmap phase 4, "the roster at scale").

   Each Pokémon is one data line: species, type, area, a role TEMPLATE, its three move names, a line for the Safari
   Pokédex and its signature card. The template gives its HP and what its moves do; the line only names them. They join
   ENEMY_DEFS (enemies.js), their area's roster (SAFARI_AREAS in safari.js: `rare` ones as its rare spawns) and the
   signature cards (cards.js) from here, so a new Pokémon needs this line, its front GIF and a SPRITE_FIT entry.

   Template numbers are for an area met first; PLACE scales them for the 2nd and 3rd area, as the main game's own wilds
   grow from biome to biome (Biome 1's ~45 HP and 6/9 attacks, Biome 3's ~64 and 8/12), on top of BIOMES' hpMult and
   dmgBonus (buildEncounter() in enemies.js).

   Types are the main game's four (Psychic would show Mewtwo's type before it's unlocked): Bug Pokémon are Grass, Ice
   ones Water, and Rock, Ground, Poison, Ghost and Flying ones Normal. A move whose real type isn't its Pokémon's (Bite
   on a Water Pokémon) is wrapped in N() so it stays x1, like `type: 'normal'` in enemies.js.
   ============================================================ */

/** How the Safari's own Pokémon grow with the area's place in the run (0, 1, 2): HP x, and + damage on every attack. */
export const PLACE = [{ hp: 1, dmg: 0 }, { hp: 1.16, dmg: 1 }, { hp: 1.42, dmg: 2 }];

/** The role templates: HP and three moves (the line names them, in this order). */
export const TEMPLATES = {
  striker:   { hp: 42, moves: [{ kind: 'attack', amount: 6 }, { kind: 'attack', amount: 5 }, { kind: 'attack', amount: 9 }] },
  bruiser:   { hp: 46, moves: [{ kind: 'attack', amount: 6 }, { kind: 'buff', amount: 2 }, { kind: 'attack', amount: 9 }] },
  tank:      { hp: 52, moves: [{ kind: 'defend', amount: 8 }, { kind: 'attack', amount: 6 }, { kind: 'attack', amount: 9 }] },
  heavy:     { hp: 56, moves: [{ kind: 'defend', amount: 9 }, { kind: 'attack', amount: 5 }, { kind: 'attack', amount: 11 }] },
  speedster: { hp: 36, moves: [{ kind: 'attack', amount: 7 }, { kind: 'attack', amount: 6 }, { kind: 'attack', amount: 10 }] },
  drainer:   { hp: 46, moves: [{ kind: 'drain', amount: 5, heal: 4 }, { kind: 'attack', amount: 6 }, { kind: 'drain', amount: 8, heal: 5 }] },
  poisoner:  { hp: 44, moves: [{ kind: 'attack', amount: 5, adds: { card: 'poison', n: 1 } }, { kind: 'defend', amount: 6 }, { kind: 'attack', amount: 9 }] },
  paralyzer: { hp: 44, moves: [{ kind: 'attack', amount: 6, adds: { card: 'paralysis', n: 1, to: 'draw' } }, { kind: 'buff', amount: 1 }, { kind: 'attack', amount: 9 }] },
  confuser:  { hp: 44, moves: [{ kind: 'attack', amount: 5 }, { kind: 'defend', amount: 6 }, { kind: 'attack', amount: 9, adds: { card: 'confusion', n: 1, to: 'draw' } }] },
  clogger:   { hp: 46, moves: [{ kind: 'status', adds: { card: 'sludge', n: 2 } }, { kind: 'attack', amount: 6 }, { kind: 'attack', amount: 9 }] },
};

/** A move whose type isn't its Pokémon's: x1 against every starter. */
const N = (name) => ({ name, type: 'normal' });

/** sig: [name, cost, art, effects, extra card fields (retain, exhaust...)], built into a `sig-<id>` card by cards.js. */
const mon = (id, name, type, area, template, moves, description, sig, more = {}) => ({ id, name, type, area, template, moves, description, sig, ...more });

export const SAFARI_MONS = [
  /* ----- Meadow ----- */
  mon('pidgey',    'Pidgey',    'normal', 'meadow', 'striker',   ['Gust', 'Quick Attack', 'Wing Attack'], 'Kicks up sand with its wings, then pecks at whatever blinks.', ['Wing Attack', 1, '🪶', { damage: 4, hits: 2, draw: 1 }]),
  mon('pidove',    'Pidove',    'normal', 'meadow', 'speedster', ['Quick Attack', 'Air Cutter', 'Air Slash'], 'Follows picnickers around in flocks, hoping for crumbs.', ['Pluck', 1, '🐦', { damage: 7, heal: 2 }]),
  mon('ponyta',    'Ponyta',    'fire',   'meadow', 'speedster', ['Ember', N('Stomp'), 'Flame Charge'], 'Its mane catches fire the moment it starts to gallop.', ['Flame Charge', 1, '🐎', { damage: 6, burn: 1, draw: 1 }]),
  mon('sunkern',   'Sunkern',   'grass',  'meadow', 'drainer',   ['Absorb', 'Razor Leaf', 'Mega Drain'], 'Drops from the sky on sunny days, already sulking.', ['Sunny Day', 1, '🌻', { heal: 4, strength: 1 }, { exhaust: true }]),
  mon('cottonee',  'Cottonee',  'grass',  'meadow', 'bruiser',   ['Absorb', 'Cotton Spore', 'Energy Ball'], 'Drifts over the fences in fluffy clumps every spring.', ['Cotton Spore', 1, '🧶', { block: 7, weaken: 2 }]),
  mon('mareep',    'Mareep',    'normal', 'meadow', 'paralyzer', ['Thunder Wave', 'Charge', 'Discharge'], 'Its wool builds up static in the dry grass. Pat it at your own risk.', ['Thunder Wave', 1, '⚡', { weaken: 2, draw: 1 }]),
  mon('lillipup',  'Lillipup',  'normal', 'meadow', 'bruiser',   ['Tackle', 'Work Up', 'Take Down'], 'Brave enough to bark at a Tauros. Not brave enough to stay.', ['Work Up', 1, '🐶', { strength: 1, block: 5 }]),
  mon('petilil',   'Petilil',   'grass',  'meadow', 'paralyzer', ['Stun Spore', 'Growth', 'Magical Leaf'], 'The leaves on its head are bitter, so nothing eats it twice.', ['Sleep Powder', 1, '💤', { weaken: 1, sap: 2 }]),
  mon('eevee',     'Eevee',     'normal', 'meadow', 'striker',   ['Tackle', 'Quick Attack', 'Take Down'], 'Seen at the edge of the grass, then gone. Nobody agrees on what it is.', ['Baton Pass', 1, '🦊', { block: 5, draw: 2 }], { rare: true }),

  /* ----- Forest ----- */
  mon('venonat',   'Venonat',   'grass',  'forest', 'poisoner',  [N('Poison Powder'), 'Supersonic', N('Psybeam')], 'Its big eyes see in the dark under the canopy.', ['Signal Beam', 1, '🦟', { damage: 6, weaken: 1, sap: 1 }]),
  mon('pineco',    'Pineco',    'grass',  'forest', 'heavy',     ['Protect', 'Bug Bite', N('Rollout')], 'Hangs from branches like a pine cone that might go off.', ['Self-Destruct', 1, '💥', { selfDamage: 6, damage: 20 }, { exhaust: true }]),
  mon('shroomish', 'Shroomish', 'grass',  'forest', 'paralyzer', ['Stun Spore', 'Growth', 'Seed Bomb'], 'Sits in the leaf litter puffing spores at anything that steps near.', ['Spore', 1, '🍄', { weaken: 2, seed: 2 }]),
  mon('pansage',   'Pansage',   'grass',  'forest', 'bruiser',   ['Vine Whip', 'Work Up', 'Seed Bomb'], 'Shares the leaves on its head with tired travellers.', ['Bullet Seed', 1, '🥦', { damage: 3, hits: 3, draw: 1 }]),
  mon('foongus',   'Foongus',   'grass',  'forest', 'clogger',   ['Spore', 'Absorb', 'Giga Drain'], 'Looks just like a Poké Ball. That is the whole trick.', ['Ingrain', 1, '🪴', { block: 4, seed: 3 }]),
  mon('karrablast','Karrablast','grass',  'forest', 'striker',   [N('Fury Attack'), N('Peck'), 'X-Scissor'], 'Spits acid at anything slimy. It has a grudge against Shelmet.', ['Fury Cutter', 1, '🐞', { damage: 5 }, { retain: true, growOnRetain: { damage: 3 } }]),
  mon('hoothoot',  'Hoothoot',  'normal', 'forest', 'confuser',  ['Peck', 'Reflect', 'Hypnosis'], 'Hoots at exactly the same time every night. You can set a clock by it.', ['Foresight', 0, '🦉', { vulnerable: 2, draw: 1 }, { exhaust: true }]),
  mon('deerling',  'Deerling',  'grass',  'forest', 'tank',      ['Sweet Scent', N('Double Kick'), 'Energy Ball'], 'Its coat changes with the seasons. Today it smells of spring.', ['Aromatherapy', 1, '🌸', { heal: 6, draw: 1 }, { exhaust: true }]),
  mon('heracross', 'Heracross', 'grass',  'forest', 'heavy',     ['Endure', N('Horn Attack'), 'Megahorn'], 'Flips logs over for sap. Then flips you over for fun.', ['Megahorn', 2, '🪲', { damage: 19 }], { rare: true }),

  /* ----- Wetland ----- */
  mon('goldeen',   'Goldeen',   'water',  'wetland', 'striker',  [N('Peck'), 'Water Pulse', 'Waterfall'], 'Swims upstream all day with its horn held high.', ['Waterfall', 1, '🐟', { damage: 7, tide: 1, draw: 1 }]),
  mon('tentacool', 'Tentacool', 'water',  'wetland', 'poisoner', [N('Poison Sting'), 'Acid Armor', 'Bubble Beam'], 'Nearly invisible in the shallows, until you step on one.', ['Acid Spray', 1, '🪼', { damage: 5, vulnerable: 2 }]),
  mon('wooper',    'Wooper',    'water',  'wetland', 'tank',     ['Amnesia', N('Mud Shot'), 'Aqua Tail'], 'Comes out of the water when it gets cold. Forgets why straight away.', ['Mud Shot', 1, '🟫', { damage: 5, block: 7 }]),
  mon('surskit',   'Surskit',   'water',  'wetland', 'speedster',[N('Quick Attack'), 'Bubble', N('Bug Buzz')], 'Skates across the ponds on legs that never get wet.', ['Sticky Web', 1, '🕸️', { weaken: 1, vulnerable: 1, tide: 1 }]),
  mon('buizel',    'Buizel',    'water',  'wetland', 'striker',  ['Water Gun', N('Quick Attack'), 'Aqua Jet'], 'Spins its two tails like a propeller to zip through the reeds.', ['Aqua Jet', 0, '💦', { damage: 4, tide: 1 }]),
  mon('panpour',   'Panpour',   'water',  'wetland', 'bruiser',  ['Water Gun', N('Work Up'), 'Scald'], 'Carries water in its tuft and showers anything that looks thirsty.', ['Scald', 1, '♨️', { damage: 7, burn: 2 }]),
  mon('wingull',   'Wingull',   'normal', 'wetland', 'confuser', ['Peck', 'Mist', 'Supersonic'], 'Rides the wind off the water and nests in the reeds.', ['Air Cutter', 1, '🪽', { damage: 3, hits: 2, vulnerable: 1 }]),
  mon('ducklett',  'Ducklett',  'normal', 'wetland', 'drainer',  ['Pluck', 'Water Gun', 'Brave Bird'], 'Dives for moss and comes up looking pleased with itself.', ['Roost', 1, '🦢', { heal: 6, block: 4 }]),
  mon('yanma',     'Yanma',     'grass',  'wetland', 'speedster',[N('Quick Attack'), 'Bug Bite', N('Air Slash')], 'Hovers over the water, then darts off faster than you can follow.', ['U-turn', 1, '🦗', { damage: 6, discard: 1, draw: 2 }]),
  mon('dratini',   'Dratini',   'normal', 'wetland', 'tank',     ['Safeguard', 'Wrap', 'Dragon Rage'], 'Said to live at the bottom of the Safari\'s lake. Hardly anyone has seen one.', ['Dragon Dance', 1, '🐉', { strength: 2, draw: 1 }], { rare: true }),

  /* ----- Marsh ----- */
  mon('grimer',    'Grimer',    'normal', 'marsh', 'clogger',    ['Sludge', 'Pound', 'Sludge Bomb'], 'Oozes out of the bog. Where it crawled, nothing grows for a year.', ['Minimize', 1, '🫠', { block: 4, blockNext: 8 }]),
  mon('ekans',     'Ekans',     'normal', 'marsh', 'poisoner',   ['Poison Sting', 'Coil', 'Bite'], 'Coils up in the reeds and waits, perfectly still.', ['Glare', 1, '🐍', { weaken: 2, vulnerable: 2, draw: 1 }, { exhaust: true }]),
  mon('croagunk',  'Croagunk',  'normal', 'marsh', 'bruiser',    ['Mud-Slap', 'Nasty Plot', 'Poison Jab'], 'Croaks to puff out its poison sacs. The croak is the warning.', ['Poison Jab', 1, '🐸', { damage: 8, sap: 1 }]),
  mon('stunfisk',  'Stunfisk',  'water',  'marsh', 'paralyzer',  [N('Thunder Shock'), 'Charge', 'Muddy Water'], 'Lies flat in the mud. It grins when stepped on, then zaps.', ['Discharge', 1, '🥞', { damage: 5, hits: 2, weaken: 1 }]),
  mon('barboach',  'Barboach',  'water',  'marsh', 'tank',       ['Amnesia', N('Mud-Slap'), 'Water Pulse'], 'Its whiskers feel the ground shake long before you do.', ['Earthquake', 2, '🌍', { damage: 16, vulnerable: 1 }]),
  mon('gulpin',    'Gulpin',    'normal', 'marsh', 'drainer',    ['Swallow', 'Pound', 'Gunk Shot'], 'Mostly stomach. It will try to swallow anything, you included.', ['Stockpile', 1, '🫃', { block: 8, strength: 1 }, { exhaust: true }]),
  mon('koffing',   'Koffing',   'normal', 'marsh', 'clogger',    ['Smog', 'Tackle', 'Sludge'], 'Floats over the marsh gas and swells up on it.', ['Haze', 1, '☁️', { block: 7, weaken: 1, draw: 1 }]),
  mon('misdreavus','Misdreavus','normal', 'marsh', 'confuser',   ['Astonish', 'Spite', 'Shadow Ball'], 'Its shrieks over the bog at night are what the stories are about.', ['Perish Song', 2, '🎶', { weaken: 3, vulnerable: 3 }, { exhaust: true }]),
  mon('carnivine', 'Carnivine', 'grass',  'marsh', 'striker',    ['Bind', 'Vine Whip', N('Crunch')], 'Hangs from the trees and smells sweet. That is how it eats.', ['Power Whip', 2, '🪤', { damage: 14, sap: 1 }]),
  mon('spiritomb', 'Spiritomb', 'normal', 'marsh', 'heavy',      ['Grudge', 'Shadow Sneak', 'Dark Pulse'], 'Bound to an old stone in the marsh. Its 108 spirits do not like visitors.', ['Grudge', 1, '🗿', { damage: 6, ifHurt: { bonus: 8 } }], { rare: true }),

  /* ----- Peak ----- */
  mon('swinub',    'Swinub',    'water',  'peak', 'tank',        [N('Mud Sport'), 'Powder Snow', N('Take Down')], 'Roots under the snow for mushrooms, nose first.', ['Ice Shard', 0, '🐗', { damage: 3, tide: 1, draw: 1 }]),
  mon('snorunt',   'Snorunt',   'water',  'peak', 'paralyzer',   ['Icy Wind', N('Double Team'), 'Ice Fang'], 'Visits the mountain huts in blizzards. Lucky, if it likes you.', ['Icy Wind', 1, '❄️', { damage: 4, weaken: 2, tide: 1 }]),
  mon('cubchoo',   'Cubchoo',   'water',  'peak', 'bruiser',     ['Powder Snow', N('Charm'), 'Icicle Crash'], 'Its runny nose is how it freezes things. Do not ask.', ['Flail', 1, '🐻‍❄️', { damage: 5, bonusIfLow: 10 }]),
  mon('sneasel',   'Sneasel',   'normal', 'peak', 'striker',     ['Scratch', 'Quick Attack', 'Ice Punch'], 'Climbs the ice walls on hooked claws to raid nests.', ['Beat Up', 1, '🦡', { damage: 2, hits: 4 }]),
  mon('larvitar',  'Larvitar',  'normal', 'peak', 'heavy',       ['Sandstorm', 'Bite', 'Rock Slide'], 'Eats its way through the mountain, then eats the mountain next to it.', ['Rock Slide', 2, '⛰️', { damage: 8, hits: 2, weaken: 1 }]),
  mon('roggenrola','Roggenrola','normal', 'peak', 'tank',        ['Harden', 'Tackle', 'Rock Blast'], 'Its body is a single rock. Its one ear hears the cliffs crack.', ['Iron Defense', 1, '🧱', { block: 10, blockNext: 3 }]),
  mon('slugma',    'Slugma',    'fire',   'peak', 'tank',        [N('Harden'), 'Ember', 'Lava Plume'], 'Seeps out of the hot vents near the summit, glowing.', ['Lava Plume', 2, '🌋', { damage: 10, burn: 4 }]),
  mon('numel',     'Numel',     'fire',   'peak', 'heavy',       [N('Defense Curl'), 'Ember', N('Magnitude')], 'Carries a volcano on its back and never notices.', ['Yawn', 1, '🐪', { weaken: 2, block: 6 }]),
  mon('meditite',  'Meditite',  'normal', 'peak', 'bruiser',     ['Force Palm', 'Meditate', 'Hi Jump Kick'], 'Meditates on the highest ledge on one meal of berries a day.', ['Meditate', 1, '🧘', { strength: 2, focus: 4 }, { exhaust: true }]),
  mon('absol',     'Absol',     'normal', 'peak', 'striker',     ['Quick Attack', 'Bite', 'Night Slash'], 'Only comes down from the peak before an avalanche. Seeing one is bad luck.', ['Razor Wind', 2, '🌪️', { damage: 7, hits: 3 }], { rare: true }),

  /* ----- Desert ----- */
  mon('sandshrew', 'Sandshrew', 'normal', 'desert', 'tank',      ['Defense Curl', 'Scratch', 'Rollout'], 'Curls into a ball when the sand gets in its eyes, which is always.', ['Sand Attack', 0, '🏜️', { weaken: 1, draw: 1 }]),
  mon('diglett',   'Diglett',   'normal', 'desert', 'speedster', ['Scratch', 'Mud-Slap', 'Dig'], 'Pops up out of the dunes. Nobody has seen the rest of it.', ['Dig', 1, '🕳️', { damage: 6, blockNext: 5 }]),
  mon('cubone',    'Cubone',    'normal', 'desert', 'bruiser',   ['Bone Club', 'Focus Energy', 'Bonemerang'], 'Wears a skull and cries under the moon. It throws the bone hard, though.', ['Bonemerang', 2, '🦴', { damage: 9, hits: 2 }]),
  mon('trapinch',  'Trapinch',  'normal', 'desert', 'drainer',   ['Sand Tomb', 'Bite', 'Bug Bite'], 'Waits at the bottom of a sand pit for something to slide in.', ['Sand Tomb', 1, '🐜', { damage: 3, sap: 2, weaken: 1 }]),
  mon('sandile',   'Sandile',   'normal', 'desert', 'speedster', ['Bite', 'Sand Tomb', 'Crunch'], 'Swims under the sand with only its eyes showing.', ['Thief', 1, '🐊', { damage: 8, draw: 1 }]),
  mon('hippopotas','Hippopotas','normal', 'desert', 'heavy',     ['Yawn', 'Bite', 'Take Down'], 'Hides in the sand all day, then sneezes a sandstorm.', ['Sandstorm', 1, '🦛', { weaken: 1, vulnerable: 1, block: 5 }]),
  mon('skorupi',   'Skorupi',   'normal', 'desert', 'poisoner',  ['Poison Sting', 'Acupressure', 'Pin Missile'], 'Holds on with its tail claws through every sandstorm.', ['Toxic Spikes', 1, '🦂', { damage: 4, hits: 2, sap: 1 }]),
  mon('yamask',    'Yamask',    'normal', 'desert', 'paralyzer', ['Disable', 'Curse', 'Night Shade'], 'Wanders the ruins in the sand carrying a mask of the face it once had.', ['Disable', 0, '🎭', { weaken: 3 }, { exhaust: true }]),
  mon('sigilyph',  'Sigilyph',  'normal', 'desert', 'confuser',  ['Gust', 'Reflect', 'Psybeam'], 'Circles the same ruins it has guarded for a thousand years.', ['Cosmic Power', 1, '🔯', { block: 7, blockNext: 7 }]),
  mon('larvesta',  'Larvesta',  'fire',   'desert', 'bruiser',   ['Ember', N('String Shot'), 'Flame Charge'], 'Born from a fire in the dunes. Its horns spit flame when it is cross.', ['Quiver Dance', 1, '🔥', { strength: 1, block: 4, draw: 1 }], { rare: true }),
];

/** One line, made into an ENEMY_DEFS entry (enemies.js adds them all). */
export function safariMonDef(m) {
  const t = TEMPLATES[m.template];
  return {
    name: m.name, type: m.type, hp: t.hp, image: `assets/pokemon/${m.id}-front.gif`, art: false, spriteId: m.id,
    safari: true, template: m.template, description: m.description,
    moves: t.moves.map((move, i) => (typeof m.moves[i] === 'string' ? { ...move, name: m.moves[i] } : { ...move, ...m.moves[i] })),
  };
}
