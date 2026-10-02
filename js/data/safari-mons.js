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

  /* ----- Batch 2: Meadow ----- */
  mon('spearow',   'Spearow',   'normal', 'meadow', 'striker',   ['Peck', 'Fury Attack', 'Drill Peck'], 'Shrieks from the fence posts and pecks at anything that crosses its patch.', ['Drill Peck', 1, '🎯', { damage: 8, vulnerable: 2 }]),
  mon('nidoranf',  'Nidoran♀',  'normal', 'meadow', 'poisoner',  ['Poison Sting', 'Growl', 'Double Kick'], 'Small and gentle, until its barbs come up.', ['Poison Point', 1, '💜', { block: 6, sap: 2 }]),
  mon('nidoranm',  'Nidoran♂',  'normal', 'meadow', 'poisoner',  ['Poison Sting', 'Focus Energy', 'Horn Attack'], 'Keeps its ears up for danger and its horn up for everything else.', ['Double Kick', 1, '🦵', { damage: 5, hits: 2, sap: 1 }]),
  mon('jigglypuff','Jigglypuff','normal', 'meadow', 'confuser',  ['Pound', 'Defense Curl', 'Sing'], 'Sings to anyone who sits down in the grass. Then it gets cross that they fell asleep.', ['Sing', 1, '🎤', { weaken: 2, draw: 2 }, { exhaust: true }]),
  mon('doduo',     'Doduo',     'normal', 'meadow', 'speedster', ['Peck', 'Pursuit', 'Double Hit'], 'Its two heads never agree on which way to run, so it runs very fast both ways.', ['Tri Attack', 2, '🔺', { damage: 5, hits: 3, weaken: 1 }]),
  mon('skitty',    'Skitty',    'normal', 'meadow', 'confuser',  ['Tackle', 'Defense Curl', 'Attract'], 'Chases its own tail round the flowerbeds until it falls over.', ['Assist', 1, '🐱', { randomCard: 1, draw: 1 }]),
  mon('bidoof',    'Bidoof',    'normal', 'meadow', 'tank',      ['Defense Curl', 'Tackle', 'Headbutt'], 'Unbothered by anything. Gnaws on the Safari\'s signposts.', ['Super Fang', 2, '🦫', { damage: 12, weaken: 2 }]),
  mon('shinx',     'Shinx',     'normal', 'meadow', 'paralyzer', ['Spark', 'Charge', 'Bite'], 'Its fur sparks when it is scared, which is when it bites.', ['Spark', 0, '✨', { damage: 2, weaken: 2 }]),
  mon('starly',    'Starly',    'normal', 'meadow', 'striker',   ['Quick Attack', 'Wing Attack', 'Aerial Ace'], 'Flocks of them sweep the meadow at dawn, too loud to sneak past.', ['Aerial Ace', 1, '🕊️', { damage: 8 }, { innate: true }]),
  mon('kricketot', 'Kricketot', 'grass',  'meadow', 'bruiser',   ['Bug Bite', 'Bide', 'Struggle Bug'], 'Its chirping fills the long grass on warm evenings.', ['Struggle Bug', 1, '🎻', { damage: 6, weaken: 1, draw: 1 }]),
  mon('combee',    'Combee',    'grass',  'meadow', 'tank',      ['Sweet Scent', 'Bug Bite', N('Gust')], 'Three of them, one hive-mind, all after the same flower.', ['Honey Gather', 1, '🍯', { heal: 5, block: 5 }, { exhaust: true }]),
  mon('blitzle',   'Blitzle',   'normal', 'meadow', 'paralyzer', ['Thunder Wave', 'Charge', 'Flame Charge'], 'Its mane flashes before a storm. The herd follows the flash.', ['Volt Switch', 1, '⚡', { damage: 5, draw: 2 }]),
  mon('farfetchd', 'Farfetch\'d','normal','meadow', 'striker',   ['Peck', 'Fury Cutter', 'Leaf Blade'], 'Never seen without its leek, and never seen for long.', ['Leek Slash', 1, '🥬', { damage: 6, hits: 2, focus: 4 }], { rare: true }),
  mon('audino',    'Audino',    'normal', 'meadow', 'tank',      ['Heal Pulse', 'Pound', 'Double-Edge'], 'Hears your heartbeat from across the field, and comes to check on it.', ['Heal Pulse', 2, '💗', { heal: 10, block: 8 }, { exhaust: true }], { rare: true }),

  /* ----- Batch 2: Forest ----- */
  mon('caterpie',  'Caterpie',  'grass',  'forest', 'clogger',   ['String Shot', 'Tackle', 'Bug Bite'], 'Eats its own weight in leaves before lunch.', ['String Shot', 0, '🧵', { weaken: 1, sap: 1 }]),
  mon('weedle',    'Weedle',    'grass',  'forest', 'poisoner',  [N('Poison Sting'), 'Harden', 'Bug Bite'], 'The barb on its head is why nobody picks up caterpillars here.', ['Poison Sting', 1, '🐝', { damage: 6, seed: 2 }]),
  mon('ledyba',    'Ledyba',    'grass',  'forest', 'striker',   [N('Comet Punch'), 'Bug Bite', N('Mach Punch')], 'Huddles with the others under leaves when the wind turns cold.', ['Light Screen', 1, '🐞', { block: 6, blockNext: 6 }]),
  mon('spinarak',  'Spinarak',  'grass',  'forest', 'poisoner',  [N('Poison Sting'), 'String Shot', 'Leech Life'], 'Strings webs between the trunks and waits all night without a twitch.', ['Spider Web', 1, '🕸️', { block: 6, weaken: 1, sap: 1 }]),
  mon('wurmple',   'Wurmple',   'grass',  'forest', 'tank',      ['Harden', 'Tackle', 'Bug Bite'], 'Nobody knows what it will turn into. Neither does it.', ['Shield Dust', 1, '🐛', { block: 7, sap: 1 }]),
  mon('nincada',   'Nincada',   'grass',  'forest', 'tank',      ['Harden', N('Scratch'), N('Dig')], 'Lives in the roots for years, sipping sap in the dark.', ['Molt', 1, '🪲', { block: 6, heal: 4 }]),
  mon('burmy',     'Burmy',     'grass',  'forest', 'tank',      ['Protect', N('Tackle'), 'Bug Bite'], 'Wears a cloak of whatever leaves it last walked through.', ['Protect', 1, '🧥', { block: 12 }, { exhaust: true }]),
  mon('venipede',  'Venipede',  'grass',  'forest', 'poisoner',  [N('Poison Sting'), 'Defense Curl', 'Bug Bite'], 'Its bite is venomous and its temper is worse.', ['Venoshock', 1, '🪱', { damage: 5, sap: 2 }]),
  mon('exeggcute', 'Exeggcute', 'grass',  'forest', 'confuser',  ['Bullet Seed', N('Reflect'), N('Hypnosis')], 'Six eggs that talk to each other. If one goes missing, the rest go looking.', ['Egg Barrage', 1, '🥚', { damage: 3, hits: 3, seed: 1 }]),
  mon('murkrow',   'Murkrow',   'normal', 'forest', 'confuser',  ['Astonish', 'Mean Look', 'Night Shade'], 'Steals shiny things from campers and hides them in the tallest pine.', ['Pursuit', 1, '🌑', { damage: 6, ifWeak: { bonus: 5 } }]),
  mon('pachirisu', 'Pachirisu', 'normal', 'forest', 'paralyzer', ['Nuzzle', 'Charge', 'Spark'], 'Rubs its cheeks on you to say hello. It stings a bit.', ['Nuzzle', 1, '🌰', { damage: 4, weaken: 2 }]),
  mon('shuckle',   'Shuckle',   'grass',  'forest', 'heavy',     ['Withdraw', N('Rollout'), N('Rock Throw')], 'Hides berries in its shell under a rock, and forgets them until they ferment.', ['Power Trick', 2, '🐢', { block: 14, strength: 1 }, { exhaust: true }]),
  mon('scyther',   'Scyther',   'grass',  'forest', 'striker',   [N('Quick Attack'), 'Fury Cutter', 'X-Scissor'], 'Cuts through the undergrowth faster than the eye can follow.', ['Swords Dance', 1, '🗡️', { strength: 3 }, { exhaust: true }], { rare: true }),
  mon('pinsir',    'Pinsir',    'grass',  'forest', 'heavy',     [N('Harden'), N('Vice Grip'), N('Submission')], 'Grips a tree trunk in its horns and won\'t let go until it snaps.', ['Submission', 2, '🤼', { damage: 20, selfDamage: 3 }], { rare: true }),

  /* ----- Batch 2: Wetland ----- */
  mon('magikarp',  'Magikarp',  'water',  'wetland', 'striker',  [N('Tackle'), N('Flail'), N('Bounce')], 'Splashes in every puddle of the wetland. Some say it becomes something terrible.', ['Splash', 0, '🎏', { tide: 2 }]),
  mon('shellder',  'Shellder',  'water',  'wetland', 'tank',     ['Withdraw', 'Clamp', 'Icicle Spear'], 'Sticks out its tongue from the shell. Do not touch the tongue.', ['Clamp', 1, '🐚', { damage: 5, block: 5, tide: 1 }]),
  mon('chinchou',  'Chinchou',  'water',  'wetland', 'paralyzer',[N('Spark'), N('Charge'), 'Bubble Beam'], 'Its lights blink out under the deep reeds like a signal.', ['Charge Beam', 2, '💡', { damage: 9, nextEnergy: 1 }]),
  mon('corphish',  'Corphish',  'water',  'wetland', 'bruiser',  ['Bubble', N('Swords Dance'), 'Crabhammer'], 'Moved into the wetland years ago and now runs the place.', ['Crabhammer', 2, '🦞', { damage: 13, tide: 2 }]),
  mon('finneon',   'Finneon',   'water',  'wetland', 'speedster',['Water Gun', 'Water Pulse', N('U-turn')], 'Its tail fins glow at night, so the pond looks full of stars.', ['Aqua Ring', 1, '💧', { heal: 4, tide: 2 }, { exhaust: true }]),
  mon('remoraid',  'Remoraid',  'water',  'wetland', 'striker',  ['Water Gun', 'Bubble Beam', N('Psybeam')], 'Shoots flies off the reeds with a jet of water.', ['Octazooka', 1, '🔫', { damage: 3, hits: 3, tide: 1 }]),
  mon('basculin',  'Basculin',  'water',  'wetland', 'striker',  ['Aqua Jet', N('Bite'), 'Aqua Tail'], 'Red stripes and blue stripes, and both would bite you.', ['Reckless', 1, '🐠', { selfDamage: 3, damage: 11 }]),
  mon('frillish',  'Frillish',  'water',  'wetland', 'drainer',  [N('Absorb'), 'Bubble', N('Hex')], 'Drifts below the lily pads and wraps around whatever swims by.', ['Cursed Body', 1, '🎐', { weaken: 1, vulnerable: 1, heal: 3 }]),
  mon('carvanha',  'Carvanha',  'water',  'wetland', 'speedster',[N('Bite'), 'Aqua Jet', N('Crunch')], 'One alone is shy. A school of them strips a branch in seconds.', ['Crunch', 1, '🦷', { damage: 6, vulnerable: 2, tide: 1 }]),
  mon('wailmer',   'Wailmer',   'water',  'wetland', 'heavy',    [N('Rest'), 'Water Gun', 'Water Spout'], 'Too big for the wetland, really. It keeps the lake topped up.', ['Water Spout', 2, '🐋', { damage: 8, perTideHeld: 2 }]),
  mon('mantyke',   'Mantyke',   'water',  'wetland', 'tank',     ['Aqua Ring', 'Bubble', 'Bubble Beam'], 'Glides just under the surface, its back pattern rippling.', ['Wide Guard', 1, '🪁', { block: 8, tide: 1 }]),
  mon('azurill',   'Azurill',   'normal', 'wetland', 'confuser', ['Pound', 'Charm', 'Bubble Beam'], 'Bounces along the bank on its tail. It never lands where it means to.', ['Charm', 1, '🫧', { weaken: 3, block: 3 }]),
  mon('feebas',    'Feebas',    'water',  'wetland', 'tank',     ['Protect', N('Tackle'), 'Water Pulse'], 'Shabby and slow, it hides in the weeds. Fish it out with patience.', ['Beautify', 1, '🌈', { heal: 5, strength: 1, draw: 1 }, { exhaust: true }], { rare: true }),
  mon('lapras',    'Lapras',    'water',  'wetland', 'heavy',    ['Mist', 'Water Gun', 'Ice Beam'], 'Sings across the lake on foggy mornings. Hardly any are left.', ['Ice Beam', 2, '🧊', { damage: 12, weaken: 2, tide: 2 }], { rare: true }),

  /* ----- Batch 2: Marsh ----- */
  mon('gastly',    'Gastly',    'normal', 'marsh', 'confuser',   ['Lick', 'Mean Look', 'Hypnosis'], 'A puff of marsh gas with a grin in it.', ['Lick', 0, '👅', { damage: 3, vulnerable: 1 }]),
  mon('duskull',   'Duskull',   'normal', 'marsh', 'heavy',      ['Protect', 'Night Shade', 'Will-O-Wisp'], 'Follows lost children through the reeds, the stories say.', ['Will-O-Wisp', 1, '👻', { burn: 3, weaken: 1 }]),
  mon('shuppet',   'Shuppet',   'normal', 'marsh', 'drainer',    ['Astonish', 'Knock Off', 'Shadow Sneak'], 'Feeds on grudges. The marsh has plenty.', ['Knock Off', 1, '🧸', { damage: 7, sap: 1, draw: 1 }]),
  mon('drifloon',  'Drifloon',  'normal', 'marsh', 'drainer',    ['Astonish', 'Gust', 'Ominous Wind'], 'Floats over the bog on still evenings, looking for a hand to hold.', ['Ominous Wind', 1, '🎈', { damage: 5, weaken: 1, vulnerable: 1 }]),
  mon('trubbish',  'Trubbish',  'normal', 'marsh', 'clogger',    ['Toxic Spikes', 'Pound', 'Sludge'], 'Grew out of a bag someone left by the boardwalk.', ['Clear Smog', 1, '🗑️', { damage: 5, exhaustPick: 1, draw: 1 }]),
  mon('stunky',    'Stunky',    'normal', 'marsh', 'poisoner',   ['Scratch', 'Smokescreen', 'Fury Swipes'], 'Raises its tail as a warning. There is no second warning.', ['Smokescreen', 1, '🦨', { weaken: 2, block: 4 }]),
  mon('tynamo',    'Tynamo',    'normal', 'marsh', 'paralyzer',  ['Thunder Wave', 'Charge', 'Spark'], 'Swims in glowing shoals through the dark channels.', ['Charge', 1, '🔋', { nextEnergy: 1, draw: 2 }]),
  mon('seviper',   'Seviper',   'normal', 'marsh', 'poisoner',   ['Poison Tail', 'Glare', 'Poison Fang'], 'Sharpens its tail blade on the marsh stones. It has a feud with Zangoose.', ['Poison Fang', 1, '🔪', { damage: 4, sap: 1, vulnerable: 1 }]),
  mon('roselia',   'Roselia',   'grass', 'marsh', 'poisoner',    [N('Poison Sting'), 'Synthesis', 'Magical Leaf'], 'Grows where the marsh water is cleanest. Its thorns are not.', ['Petal Dance', 2, '🌹', { damage: 4, hits: 4, seed: 1 }]),
  mon('qwilfish',  'Qwilfish',  'water', 'marsh', 'poisoner',    [N('Poison Sting'), N('Minimize'), 'Aqua Tail'], 'Gulps water till it is round, then fires its spines.', ['Spikes', 1, '🐡', { block: 5, tide: 1, sap: 1 }]),
  mon('shelmet',   'Shelmet',   'grass', 'marsh', 'tank',        ['Acid Armor', N('Acid'), 'Bug Bite'], 'Shuts its helmet tight at the first sign of Karrablast.', ['Acid Armor', 2, '🐌', { block: 12, blur: 1 }]),
  mon('lickitung', 'Lickitung', 'normal', 'marsh', 'tank',       ['Defense Curl', 'Lick', 'Stomp'], 'Its tongue is twice its height and always a bit sticky.', ['Wring Out', 2, '😛', { damage: 10, heal: 4 }]),
  mon('gengar',    'Gengar',    'normal', 'marsh', 'striker',    ['Lick', 'Shadow Punch', 'Shadow Ball'], 'Hides in your shadow on the boardwalk. The cold you feel is it laughing.', ['Shadow Ball', 2, '🔮', { damage: 14, vulnerable: 2, draw: 1 }], { rare: true }),
  mon('rotom',     'Rotom',     'normal', 'marsh', 'paralyzer',  ['Thunder Shock', 'Charge', 'Ominous Wind'], 'Lives in the ranger hut\'s old radio. Sometimes it gets out.', ['Trick', 0, '📺', { randomCard: 1 }, { exhaust: true }], { rare: true }),

  /* ----- Batch 2: Peak ----- */
  mon('zubat',     'Zubat',     'normal', 'peak', 'drainer',     ['Leech Life', 'Bite', 'Poison Fang'], 'Pours out of the mountain caves at dusk in screeching clouds.', ['Leech Life', 1, '🦇', { damage: 6, healDealt: true }]),
  mon('geodude',   'Geodude',   'normal', 'peak', 'tank',        ['Defense Curl', 'Rock Throw', 'Magnitude'], 'Lies on the trail like any other rock. Hikers trip on it, then it trips them.', ['Rollout', 1, '⚪', { damage: 4 }, { retain: true, growOnRetain: { damage: 4 } }]),
  mon('machop',    'Machop',    'normal', 'peak', 'bruiser',     ['Low Kick', 'Focus Energy', 'Karate Chop'], 'Trains by carrying boulders up the peak and back down.', ['Karate Chop', 1, '🥋', { damage: 7, draw: 1, focus: 3 }]),
  mon('onix',      'Onix',      'normal', 'peak', 'heavy',       ['Harden', 'Bind', 'Rock Slide'], 'Tunnels through the mountain at forty miles an hour. The path shakes.', ['Bind', 1, '⛓️', { damage: 5, weaken: 1, block: 5 }]),
  mon('seel',      'Seel',      'water',  'peak', 'bruiser',     ['Aqua Jet', 'Aqua Ring', 'Aurora Beam'], 'Naps on the frozen tarn and swims under the ice for fun.', ['Aurora Beam', 1, '🦭', { damage: 6, weaken: 1, tide: 1 }]),
  mon('snover',    'Snover',    'grass',  'peak', 'tank',        ['Ingrain', N('Powder Snow'), 'Razor Leaf'], 'Grows berries like ice lollies on the snowline.', ['Snow Warning', 1, '🌲', { block: 6, weaken: 1, seed: 1 }]),
  mon('delibird',  'Delibird',  'water',  'peak', 'striker',     [N('Present'), 'Powder Snow', N('Drill Peck')], 'Carries food in its tail and gives it to lost climbers. Sometimes it explodes.', ['Present', 1, '🎁', { randomCard: 1, heal: 3 }]),
  mon('smoochum',  'Smoochum',  'water',  'peak', 'confuser',    ['Powder Snow', N('Reflect'), N('Confusion')], 'Checks its face in every frozen puddle on the way up.', ['Sweet Kiss', 1, '💋', { weaken: 2, tide: 2 }]),
  mon('vanillite', 'Vanillite', 'water',  'peak', 'tank',        ['Mist', 'Icicle Spear', 'Avalanche'], 'Made of the snow on the summit. In summer it hides in the caves.', ['Avalanche', 2, '🍦', { damage: 8, ifHurt: { bonus: 8 } }]),
  mon('aron',      'Aron',      'normal', 'peak', 'heavy',       ['Iron Defense', 'Headbutt', 'Iron Head'], 'Eats iron ore out of the cliffs, and the odd climbing peg.', ['Iron Head', 2, '🔩', { damage: 11, block: 9 }]),
  mon('magby',     'Magby',     'fire',   'peak', 'striker',     ['Ember', N('Smog'), 'Fire Punch'], 'Breathes little flames by the hot vents. Healthy ones glow yellow.', ['Fire Punch', 1, '🥊', { damage: 6, burn: 2 }]),
  mon('mankey',    'Mankey',    'normal', 'peak', 'bruiser',     ['Low Kick', 'Rage', 'Cross Chop'], 'Angry when it is cold, angry when it is warm, angry when you look at it.', ['Cross Chop', 2, '🐒', { damage: 11, bonusIfLow: 6 }]),
  mon('aerodactyl','Aerodactyl','normal', 'peak', 'speedster',   ['Bite', 'Wing Attack', 'Rock Slide'], 'Something with that shape circles the summit. It shouldn\'t still be alive.', ['Ancient Power', 1, '🦖', { damage: 6, strength: 1 }], { rare: true }),
  mon('riolu',     'Riolu',     'normal', 'peak', 'bruiser',     ['Quick Attack', 'Bulk Up', 'Force Palm'], 'Reads your aura from the ledge above. It already knows you are coming.', ['Aura Sphere', 1, '🔵', { damage: 9, focus: 2 }], { rare: true }),

  /* ----- Batch 2: Desert ----- */
  mon('rhyhorn',   'Rhyhorn',   'normal', 'desert', 'heavy',     ['Harden', 'Horn Attack', 'Take Down'], 'Charges in a straight line until it forgets why. It forgets fast.', ['Horn Drill', 3, '🦏', { damage: 30 }, { exhaust: true }]),
  mon('phanpy',    'Phanpy',    'normal', 'desert', 'tank',      ['Defense Curl', 'Rollout', 'Take Down'], 'Sprays dust over its back with its trunk to keep cool.', ['Endeavor', 1, '🐘', { damage: 4, bonusIfLow: 8, block: 4 }]),
  mon('gligar',    'Gligar',    'normal', 'desert', 'speedster', ['Poison Sting', 'Quick Attack', 'Slash'], 'Glides off the rock spires and lands on your face.', ['Acrobatics', 1, '🪂', { damage: 5, hits: 2, draw: 1 }]),
  mon('baltoy',    'Baltoy',    'normal', 'desert', 'confuser',  ['Mud-Slap', 'Cosmic Power', 'Confusion'], 'Found spinning in the ruins on one foot, as it has for centuries.', ['Gyro Ball', 1, '🏺', { damage: 4, block: 4, draw: 1 }]),
  mon('cacnea',    'Cacnea',    'grass',  'desert', 'poisoner',  [N('Poison Sting'), 'Ingrain', 'Needle Arm'], 'Stands still in the sand for days. Lost travellers think it is a signpost.', ['Needle Arm', 1, '🌵', { damage: 5, hits: 2, seed: 1 }]),
  mon('bonsly',    'Bonsly',    'normal', 'desert', 'tank',      ['Fake Tears', 'Rock Throw', 'Rock Tomb'], 'Cries to keep its body damp in the dry air. The tears are fake.', ['Fake Tears', 0, '😢', { vulnerable: 1, draw: 1 }]),
  mon('dwebble',   'Dwebble',   'grass',  'desert', 'tank',      ['Withdraw', 'Bug Bite', N('Rock Slide')], 'Carves a stone into a house and carries it everywhere.', ['Shell Smash', 1, '🏠', { strength: 2, selfDamage: 4 }]),
  mon('scraggy',   'Scraggy',   'normal', 'desert', 'bruiser',   ['Low Kick', 'Swagger', 'Brick Break'], 'Holds its baggy skin up with one hand and headbutts with the rest.', ['Brick Break', 1, '👊', { damage: 8, blockNext: 4 }]),
  mon('drilbur',   'Drilbur',   'normal', 'desert', 'striker',   ['Scratch', 'Mud-Slap', 'Drill Run'], 'Spins its claws together and drills under the dunes in seconds.', ['Drill Run', 2, '⛏️', { damage: 7, hits: 2, draw: 1 }]),
  mon('natu',      'Natu',      'normal', 'desert', 'confuser',  ['Night Shade', 'Miracle Eye', 'Confuse Ray'], 'Stares at the sun all day without blinking. It is seeing tomorrow.', ['Teleport', 0, '🟢', { block: 3, discard: 1, draw: 2 }]),
  mon('anorith',   'Anorith',   'grass',  'desert', 'striker',   [N('Scratch'), 'Fury Cutter', N('Ancient Power')], 'Dug out of the dry seabed under the dunes, still twitching.', ['Rock Blast', 1, '🦐', { damage: 3, hits: 3, sap: 1 }]),
  mon('lileep',    'Lileep',    'grass',  'desert', 'drainer',   ['Absorb', N('Acid'), 'Giga Drain'], 'A sea lily from when the desert was ocean. It still sways to the tide.', ['Giga Drain', 2, '🌺', { damage: 8, heal: 4, seed: 1 }]),
  mon('gible',     'Gible',     'normal', 'desert', 'speedster', ['Tackle', 'Sand Tomb', 'Dragon Claw'], 'Nests in the warm caves under the sand and bites anything that moves.', ['Dragon Rush', 2, '🐲', { damage: 16, draw: 1 }], { rare: true }),
  mon('darmanitan','Darmanitan','fire',   'desert', 'bruiser',   ['Fire Fang', N('Work Up'), 'Flare Blitz'], 'Its core burns at 1,400 degrees. In the desert heat it barely notices.', ['Hammer Arm', 2, '🦍', { damage: 13, burn: 3 }], { rare: true }),
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
