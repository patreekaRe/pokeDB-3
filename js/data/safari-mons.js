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
  striker:   { hp: 46, moves: [{ kind: 'attack', amount: 6 }, { kind: 'attack', amount: 5 }, { kind: 'attack', amount: 9 }] },
  bruiser:   { hp: 51, moves: [{ kind: 'attack', amount: 6 }, { kind: 'buff', amount: 2 }, { kind: 'attack', amount: 9 }] },
  tank:      { hp: 57, moves: [{ kind: 'defend', amount: 8 }, { kind: 'attack', amount: 6 }, { kind: 'attack', amount: 9 }] },
  heavy:     { hp: 62, moves: [{ kind: 'defend', amount: 9 }, { kind: 'attack', amount: 5 }, { kind: 'attack', amount: 11 }] },
  speedster: { hp: 40, moves: [{ kind: 'attack', amount: 7 }, { kind: 'attack', amount: 6 }, { kind: 'attack', amount: 10 }] },
  drainer:   { hp: 51, moves: [{ kind: 'drain', amount: 5, heal: 4 }, { kind: 'attack', amount: 6 }, { kind: 'drain', amount: 8, heal: 5 }] },
  poisoner:  { hp: 48, moves: [{ kind: 'attack', amount: 5, adds: { card: 'poison', n: 1 } }, { kind: 'defend', amount: 6 }, { kind: 'attack', amount: 9 }] },
  paralyzer: { hp: 48, moves: [{ kind: 'attack', amount: 6, adds: { card: 'paralysis', n: 1, to: 'draw' } }, { kind: 'buff', amount: 1 }, { kind: 'attack', amount: 9 }] },
  confuser:  { hp: 48, moves: [{ kind: 'attack', amount: 5 }, { kind: 'defend', amount: 6 }, { kind: 'attack', amount: 9, adds: { card: 'confusion', n: 1, to: 'draw' } }] },
  clogger:   { hp: 51, moves: [{ kind: 'status', adds: { card: 'sludge', n: 2 } }, { kind: 'attack', amount: 6 }, { kind: 'attack', amount: 9 }] },
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
  /* ----- Batch 3: Meadow ----- */
  mon('ninetales', 'Ninetales', 'fire',   'meadow', 'confuser',  ['Ember', N('Safeguard'), N('Confuse Ray')], 'Lies in the warm grass with its nine tails fanned out. Pull one and it curses you for a thousand years.', ['Fire Spin', 1, '🦊', { damage: 3, hits: 2, burn: 2 }]),
  mon('rapidash',  'Rapidash',  'fire',   'meadow', 'speedster', ['Flame Wheel', N('Stomp'), 'Flare Blitz'], 'Races the wind across the meadow and leaves a line of scorched grass behind it.', ['Flame Wheel', 1, '🦄', { damage: 8, burn: 1 }]),
  mon('arcanine',  'Arcanine',  'fire',   'meadow', 'heavy',     [N('Protect'), 'Fire Fang', N('Extreme Speed')], 'Guards the Safari\'s gates. It is gone and back before the gate finishes creaking.', ['Extreme Speed', 0, '🐕', { damage: 5 }, { innate: true }]),
  mon('pikachu',   'Pikachu',   'normal', 'meadow', 'paralyzer', ['Thunder Shock', 'Charge', 'Thunderbolt'], 'Nibbles the power lines round the rest house. The lights flicker when it is happy.', ['Thunderbolt', 2, '⚡', { damage: 12, weaken: 1, draw: 1 }]),
  mon('clefairy',  'Clefairy',  'normal', 'meadow', 'confuser',  ['Pound', 'Cosmic Power', 'Moonblast'], 'Dances in a ring on moonlit nights. Step inside and you forget the way out.', ['Moonlight', 1, '🌙', { heal: 5, block: 4 }]),
  mon('meowth',    'Meowth',    'normal', 'meadow', 'striker',   ['Scratch', 'Fake Out', 'Pay Day'], 'Steals the coins visitors drop and hides them under the rest house.', ['Pay Day', 1, '🪙', { damage: 3, hits: 2, weaken: 1, draw: 1 }]),
  mon('taillow',   'Taillow',   'normal', 'meadow', 'speedster', ['Peck', 'Quick Attack', 'Aerial Ace'], 'Small, loud and fearless. It picks fights with Pidgeotto for the fun of it.', ['Aerial Ace', 1, '🐦', { damage: 9 }]),
  mon('patrat',    'Patrat',    'normal', 'meadow', 'tank',      ['Detect', 'Bite', 'Crunch'], 'Keeps watch from the long grass with its cheeks stuffed full of seeds.', ['Detect', 1, '👀', { block: 6, vulnerable: 1 }]),
  mon('sunflora',  'Sunflora',  'grass',  'meadow', 'drainer',   ['Absorb', 'Razor Leaf', 'Giga Drain'], 'Turns to follow the sun all day. At dusk it droops and sulks.', ['Petal Blizzard', 2, '🌻', { damage: 6, hits: 2, heal: 3 }]),
  mon('skiploom',  'Skiploom',  'grass',  'meadow', 'bruiser',   [N('Tackle'), 'Growth', 'Bullet Seed'], 'Opens its flower when it is warm and floats away when the wind changes.', ['Acrobatics', 1, '🌼', { damage: 6, block: 3, draw: 1 }]),
  mon('volbeat',   'Volbeat',   'grass',  'meadow', 'paralyzer', [N('Flash'), 'Tail Glow', 'Bug Buzz'], 'Draws shapes in the night sky with its tail light, mostly hearts.', ['Tail Glow', 1, '💡', { strength: 2, weaken: 1 }, { exhaust: true }]),
  mon('illumise',  'Illumise',  'grass',  'meadow', 'confuser',  [N('Tackle'), N('Wish'), 'Bug Buzz'], 'Leads the Volbeat in their dances with a sweet scent only they can smell.', ['Wish', 1, '🌟', { heal: 3, blockNext: 6 }]),
  mon('flareon',   'Flareon',   'fire',   'meadow', 'bruiser',   ['Fire Fang', N('Work Up'), 'Flare Blitz'], 'Its fluffy collar is hot enough to dry a wet picnic blanket in a minute.', ['Flash Fire', 1, '🔥', { burn: 2, strength: 1 }, { exhaust: true }], { rare: true }),
  mon('togepi',    'Togepi',    'normal', 'meadow', 'tank',      ['Charm', 'Pound', 'Ancient Power'], 'Found asleep in a flowerbed once. Everyone who saw it had a lucky week.', ['Ancient Power', 1, '🥚', { damage: 5, strength: 1, block: 3 }], { rare: true }),

  /* ----- Batch 3: Forest ----- */
  mon('simisear',  'Simisear',  'fire',   'forest', 'bruiser',   ['Flame Burst', N('Work Up'), 'Fire Punch'], 'Lights the forest paths with its tail and sips sweet drinks from the flowers.', ['Incinerate', 1, '🐵', { damage: 5, burn: 3 }]),
  mon('simipour',  'Simipour',  'water',  'forest', 'bruiser',   ['Water Gun', N('Work Up'), 'Brine'], 'Sprays the trees with its tail until the whole glade smells of rain.', ['Soak', 1, '🐒', { tide: 2, weaken: 1, draw: 1 }]),
  mon('butterfree','Butterfree','grass',  'forest', 'confuser',  ['Bug Bite', N('Protect'), N('Psybeam')], 'Shakes sleepy dust from its wings over the clearings at dusk.', ['Silver Wind', 1, '🦋', { damage: 5, weaken: 1, draw: 1 }]),
  mon('beedrill',  'Beedrill',  'grass',  'forest', 'poisoner',  [N('Poison Sting'), N('Harden'), 'Twineedle'], 'Guards its hive in a buzzing swarm. Do not go near the hollow oak.', ['Twineedle', 1, '🐝', { damage: 4, hits: 2, weaken: 1 }]),
  mon('gloom',     'Gloom',     'grass',  'forest', 'clogger',   [N('Stench'), 'Absorb', 'Petal Dance'], 'Its nectar smells so bad that only its fans will come near it.', ['Sweet Scent', 1, '🌺', { weaken: 2, vulnerable: 1 }]),
  mon('parasect',  'Parasect',  'grass',  'forest', 'drainer',   ['Leech Life', N('Slash'), 'Giga Drain'], 'The mushroom has taken over. It walks to the dampest spot in the forest and stays.', ['Leech Life', 1, '🍄', { damage: 7, heal: 3 }]),
  mon('nuzleaf',   'Nuzleaf',   'grass',  'forest', 'striker',   ['Razor Leaf', N('Fake Out'), N('Feint Attack')], 'Plays a leaf whistle in the trees. The tune makes travellers lose their way.', ['Fake Out', 0, '🌰', { damage: 3, weaken: 1 }, { exhaust: true }]),
  mon('joltik',    'Joltik',    'grass',  'forest', 'paralyzer', [N('Electroweb'), N('Charge'), 'Bug Buzz'], 'Rides on bigger Pokémon to drink the static off their fur.', ['Electroweb', 1, '🕷️', { damage: 4, weaken: 1, vulnerable: 1 }]),
  mon('ferroseed', 'Ferroseed', 'grass',  'forest', 'heavy',     [N('Iron Defense'), 'Pin Missile', N('Gyro Ball')], 'Sticks its spikes into cave ceilings and sucks the iron out of the rock.', ['Spikes', 1, '⚙️', { block: 8, sap: 1 }]),
  mon('slakoth',   'Slakoth',   'normal', 'forest', 'tank',      ['Yawn', 'Scratch', 'Feint Attack'], 'Lies in the same branch for twenty hours a day. The other four it eats leaves.', ['Slack Off', 1, '🦥', { heal: 7 }, { exhaust: true }]),
  mon('poochyena', 'Poochyena', 'normal', 'forest', 'striker',   ['Tackle', 'Bite', 'Crunch'], 'Chases anything that runs. Stand still and it loses interest.', ['Howl', 0, '🐺', { strength: 1, block: 2 }, { exhaust: true }]),
  mon('purrloin',  'Purrloin',  'normal', 'forest', 'speedster', ['Scratch', 'Fury Swipes', 'Night Slash'], 'Acts cute to get close, then makes off with your lunch.', ['Assurance', 1, '🐈‍⬛', { damage: 5, ifHurt: { bonus: 5 } }]),
  mon('leafeon',   'Leafeon',   'grass',  'forest', 'striker',   ['Razor Leaf', N('Quick Attack'), 'Leaf Blade'], 'Basks in the sunbeams where the canopy breaks. The air around it is clean and green.', ['Leaf Blade', 2, '🍃', { damage: 15, draw: 1 }], { rare: true }),
  mon('zorua',     'Zorua',     'normal', 'forest', 'confuser',  ['Scratch', 'Fake Tears', 'Night Daze'], 'Disguises itself as a lost child to lead hunters in circles.', ['Night Daze', 1, '🌑', { damage: 7, weaken: 1 }], { rare: true }),

  /* ----- Batch 3: Wetland ----- */
  mon('golduck',   'Golduck',   'water',  'wetland', 'confuser', ['Water Gun', N('Amnesia'), N('Confusion')], 'Swims the lake faster than any boat. Its forehead gem glows when it thinks.', ['Amnesia', 1, '🦆', { block: 7, tide: 2 }]),
  mon('poliwhirl', 'Poliwhirl', 'water',  'wetland', 'bruiser',  ['Bubble', N('Belly Drum'), N('Body Slam')], 'Staring at its belly swirl for too long makes people sleepy.', ['Belly Drum', 0, '🌀', { selfDamage: 4, strength: 2 }, { exhaust: true }]),
  mon('kingler',   'Kingler',   'water',  'wetland', 'heavy',    [N('Harden'), 'Bubble Beam', 'Crabhammer'], 'Its big claw is strong enough to crush stone, and too heavy to aim.', ['Crabhammer', 2, '🦀', { damage: 13, vulnerable: 2 }]),
  mon('corsola',   'Corsola',   'water',  'wetland', 'tank',     [N('Harden'), 'Bubble Beam', N('Rock Blast')], 'Grows in the warm shallows. A snapped branch grows back by morning.', ['Recover', 1, '🪸', { heal: 3, block: 7 }]),
  mon('octillery', 'Octillery', 'water',  'wetland', 'striker',  ['Water Gun', N('Psybeam'), 'Octazooka'], 'Hides in the reeds and fires ink at anything that looks like a target.', ['Octazooka', 1, '🐙', { damage: 6, weaken: 2 }]),
  mon('luvdisc',   'Luvdisc',   'water',  'wetland', 'speedster',['Water Gun', N('Take Down'), 'Water Pulse'], 'Couples on the lake are said to find one in the shallows. It is mostly luck.', ['Sweet Kiss', 0, '💗', { weaken: 1, heal: 2 }]),
  mon('clamperl',  'Clamperl',  'water',  'wetland', 'tank',     ['Withdraw', 'Clamp', 'Whirlpool'], 'Makes one perfect pearl in its whole life and will not let go of it.', ['Whirlpool', 1, '🐚', { damage: 4, tide: 2 }]),
  mon('pelipper',  'Pelipper',  'water',  'wetland', 'drainer',  ['Water Gun', N('Wing Attack'), 'Brine'], 'Carries Wingull chicks and small fish home in its beak. Sometimes both.', ['Tailwind', 1, '🦅', { block: 4, draw: 2 }]),
  mon('seaking',   'Seaking',   'water',  'wetland', 'striker',  [N('Horn Attack'), 'Water Pulse', N('Megahorn')], 'Digs nests in the riverbed with its horn every autumn.', ['Horn Attack', 1, '🐠', { damage: 6, block: 4 }]),
  mon('swanna',    'Swanna',    'water',  'wetland', 'speedster',[N('Wing Attack'), 'Bubble Beam', N('Brave Bird')], 'Starts dancing at dawn and the whole lake joins in.', ['Brave Bird', 1, '🦢', { damage: 12, selfDamage: 4 }]),
  mon('bibarel',   'Bibarel',   'normal', 'wetland', 'tank',     ['Defense Curl', 'Headbutt', 'Hyper Fang'], 'Dams the streams with whatever wood it finds, the signposts included.', ['Hyper Fang', 1, '🦫', { damage: 10 }]),
  mon('masquerain','Masquerain','grass',  'wetland', 'confuser', ['Bug Buzz', N('Mist'), N('Scary Face')], 'The eye patterns on its antennae glare at anything that comes near the pond.', ['Scary Face', 0, '👁️', { vulnerable: 1, block: 3 }]),
  mon('vaporeon',  'Vaporeon',  'water',  'wetland', 'tank',     ['Acid Armor', 'Water Pulse', 'Hydro Pump'], 'Melts into the lake when it swims. You only see it when it wants you to.', ['Aqua Ring', 1, '💧', { heal: 3, tide: 3 }], { rare: true }),
  mon('dragonair', 'Dragonair', 'normal', 'wetland', 'heavy',    ['Safeguard', 'Wrap', 'Dragon Tail'], 'The weather turns when it rises from the lake. Nobody has seen it twice.', ['Dragon Tail', 2, '🐲', { damage: 11, weaken: 2, draw: 1 }], { rare: true }),

  /* ----- Batch 3: Marsh ----- */
  mon('lampent',   'Lampent',   'fire',   'marsh', 'drainer',    [N('Hex'), 'Ember', N('Night Shade')], 'Glows over the bog at night. Follow its light and you will not come back.', ['Hex', 1, '🏮', { damage: 4, burn: 2, weaken: 1 }]),
  mon('haunter',   'Haunter',   'normal', 'marsh', 'confuser',   ['Lick', 'Curse', 'Hypnosis'], 'Licks travellers in the fog. They shiver for days afterwards.', ['Curse', 1, '👻', { selfDamage: 3, vulnerable: 2, weaken: 2 }, { exhaust: true }]),
  mon('muk',       'Muk',       'normal', 'marsh', 'clogger',    ['Sludge', 'Pound', 'Sludge Wave'], 'The marsh water turns black where it soaks. The smell is worse.', ['Acid Armor', 2, '🟣', { block: 15, weaken: 1 }]),
  mon('weezing',   'Weezing',   'normal', 'marsh', 'clogger',    ['Smog', 'Tackle', 'Explosion'], 'Its two heads breathe in the bog gas and puff it out twice as foul.', ['Explosion', 2, '💥', { damage: 24, selfDamage: 8 }, { exhaust: true }]),
  mon('arbok',     'Arbok',     'normal', 'marsh', 'poisoner',   ['Acid', 'Coil', 'Poison Fang'], 'The face on its hood scares off anything bigger than it.', ['Coil', 1, '🐍', { strength: 1, block: 6 }]),
  mon('swalot',    'Swalot',    'normal', 'marsh', 'drainer',    ['Spit Up', 'Body Slam', 'Swallow'], 'Swallows things whole and spits out what it doesn\'t like, which is not much.', ['Spit Up', 1, '🤢', { damage: 8, heal: 4 }, { exhaust: true }]),
  mon('quagsire',  'Quagsire',  'water',  'marsh', 'tank',       ['Amnesia', N('Mud Shot'), N('Earthquake')], 'Bumps into boats and smiles. It has no idea what happened.', ['Mud Bomb', 1, '🟤', { damage: 5, block: 4, tide: 1 }]),
  mon('whiscash',  'Whiscash',  'water',  'marsh', 'heavy',      ['Amnesia', N('Mud-Slap'), N('Magnitude')], 'Guards the deepest pool in the marsh and shakes the ground if you fish there.', ['Muddy Water', 2, '🐋', { damage: 9, weaken: 2, tide: 2 }]),
  mon('gastrodon', 'Gastrodon', 'water',  'marsh', 'drainer',    [N('Mud Bomb'), 'Water Pulse', 'Muddy Water'], 'Oozes along the bank. Its colour says which side of the marsh it comes from.', ['Storm Drain', 1, '🐌', { tide: 3, block: 4 }]),
  mon('amoonguss', 'Amoonguss', 'grass',  'marsh', 'clogger',    ['Spore', N('Feint Attack'), 'Giga Drain'], 'Waves its Poké Ball caps to lure people close, then puffs spores.', ['Rage Powder', 1, '🍄', { block: 7, seed: 2 }]),
  mon('dustox',    'Dustox',    'grass',  'marsh', 'poisoner',   [N('Poison Sting'), N('Protect'), 'Silver Wind'], 'Drawn to the lamps at the marsh huts. The leaves under them wilt.', ['Toxic', 1, '☠️', { sap: 2, weaken: 2 }, { exhaust: true }]),
  mon('banette',   'Banette',   'normal', 'marsh', 'striker',    ['Shadow Sneak', 'Knock Off', 'Shadow Claw'], 'A doll thrown in the bog. It is looking for the child who threw it.', ['Knock Off', 1, '🧸', { damage: 8, weaken: 1 }]),
  mon('chandelure','Chandelure','fire',   'marsh', 'confuser',   [N('Hex'), N('Imprison'), 'Inferno'], 'Its flames burn spirits, not wood. The marsh is very quiet near it.', ['Inferno', 2, '🕯️', { burn: 5, weaken: 2 }], { rare: true }),
  mon('mismagius', 'Mismagius', 'normal', 'marsh', 'confuser',   ['Astonish', 'Mean Look', 'Mystical Fire'], 'Mutters spells in the fog. Some bring luck. Most bring headaches.', ['Mystical Fire', 1, '🧙', { damage: 5, vulnerable: 1, draw: 1 }], { rare: true }),

  /* ----- Batch 3: Peak ----- */
  mon('magcargo',  'Magcargo',  'fire',   'peak', 'tank',        [N('Harden'), 'Ember', 'Flamethrower'], 'Its shell is cooled lava. Bits crack off as it creeps along the ridge.', ['Flame Body', 1, '🐌', { block: 6, burn: 2 }]),
  mon('camerupt',  'Camerupt',  'fire',   'peak', 'heavy',       [N('Defense Curl'), 'Lava Plume', N('Earth Power')], 'The humps on its back erupt when it is angry, every ten minutes or so.', ['Eruption', 2, '🌋', { damage: 8, burn: 3, block: 4 }]),
  mon('graveler',  'Graveler',  'normal', 'peak', 'tank',        ['Defense Curl', 'Rock Throw', 'Rollout'], 'Rolls down the mountain path once a year to shed its old skin of rock.', ['Rollout', 1, '🪨', { damage: 5 }, { retain: true, growOnRetain: { damage: 4 } }]),
  mon('machoke',   'Machoke',   'normal', 'peak', 'bruiser',     ['Low Kick', 'Bulk Up', 'Seismic Toss'], 'Helps carry supplies up to the summit hut, for the training.', ['Bulk Up', 1, '💪', { strength: 1, block: 7 }]),
  mon('golbat',    'Golbat',    'normal', 'peak', 'drainer',     ['Leech Life', 'Wing Attack', 'Air Cutter'], 'Drinks until it can barely fly, then flaps back into the caves.', ['Confuse Ray', 1, '🦇', { weaken: 1, vulnerable: 1, draw: 1 }]),
  mon('piloswine', 'Piloswine', 'water',  'peak', 'tank',        [N('Mud Sport'), 'Ice Shard', N('Take Down')], 'Its hair hangs over its eyes, so it charges at everything by smell.', ['Blizzard', 2, '🌨️', { damage: 6, hits: 2, weaken: 1, tide: 1 }]),
  mon('glalie',    'Glalie',    'water',  'peak', 'striker',     ['Ice Shard', N('Bite'), 'Ice Fang'], 'Freezes the air around it into armour. Hikers find frozen Zubat near its cave.', ['Ice Fang', 1, '🧊', { damage: 7, weaken: 1, tide: 1 }]),
  mon('beartic',   'Beartic',   'water',  'peak', 'bruiser',     ['Icicle Crash', N('Swagger'), N('Slash')], 'Swims the icy lake by the summit and grows fangs of frozen breath.', ['Icicle Crash', 2, '🐻‍❄️', { damage: 13, weaken: 1, tide: 1 }]),
  mon('cryogonal', 'Cryogonal', 'water',  'peak', 'confuser',    ['Ice Shard', N('Reflect'), 'Aurora Beam'], 'Born in snow clouds. It melts to vapour on warm days and forms again at night.', ['Light Screen', 1, '❄️', { blockNext: 10 }]),
  mon('timburr',   'Timburr',   'normal', 'peak', 'bruiser',     ['Pound', 'Bulk Up', 'Hammer Arm'], 'Carries a log twice its size and helps fix the mountain huts.', ['Hammer Arm', 2, '🪵', { damage: 14, block: 4 }]),
  mon('swablu',    'Swablu',    'normal', 'peak', 'tank',        ['Safeguard', 'Peck', 'Dragon Breath'], 'Perches on hikers\' hats like a cloud. It hums when it is comfy.', ['Round', 1, '☁️', { block: 5, heal: 3 }]),
  mon('abomasnow', 'Abomasnow', 'grass',  'peak', 'heavy',       [N('Mist'), 'Razor Leaf', N('Blizzard')], 'Lives above the snow line and whips up a blizzard when you get close.', ['Wood Hammer', 2, '🌲', { damage: 16, selfDamage: 4 }]),
  mon('magmortar', 'Magmortar', 'fire',   'peak', 'striker',     ['Fire Punch', 'Ember', 'Fire Blast'], 'Fires blobs of lava from its arms into the crater, just to watch them hiss.', ['Heat Wave', 2, '🔥', { damage: 6, hits: 2, burn: 3 }], { rare: true }),
  mon('bagon',     'Bagon',     'normal', 'peak', 'bruiser',     ['Headbutt', 'Focus Energy', 'Dragon Breath'], 'Jumps off the cliffs every day, dreaming of wings. Its head is very hard.', ['Outrage', 2, '🐲', { damage: 9, hits: 2, strength: 1 }], { rare: true }),

  /* ----- Batch 3: Desert ----- */
  mon('houndoom',  'Houndoom',  'fire',   'desert', 'striker',   ['Ember', N('Bite'), 'Flamethrower'], 'Its howls echo over the dunes at night. Burns from its fire never stop stinging.', ['Foul Play', 1, '😈', { damage: 5, burn: 2, vulnerable: 1 }]),
  mon('sandslash', 'Sandslash', 'normal', 'desert', 'tank',      ['Defense Curl', 'Slash', 'Sand Tomb'], 'Rolls into a spiky ball and bowls down the dunes.', ['Crush Claw', 1, '🦔', { damage: 6, vulnerable: 1, block: 3 }]),
  mon('dugtrio',   'Dugtrio',   'normal', 'desert', 'speedster', ['Scratch', 'Sucker Punch', 'Earthquake'], 'Three heads, one tunnel. They pop up in a different order every time.', ['Sucker Punch', 0, '⛏️', { damage: 6 }, { exhaust: true }]),
  mon('marowak',   'Marowak',   'normal', 'desert', 'bruiser',   ['Bone Club', 'Swords Dance', 'Bone Rush'], 'Grew tough in the desert and swings its bone like it means it.', ['Bone Rush', 2, '🦴', { damage: 3, hits: 5 }]),
  mon('vibrava',   'Vibrava',   'normal', 'desert', 'speedster', ['Bug Bite', 'Dragon Breath', 'Supersonic'], 'Its buzzing wings whip up the sand into a hum you feel in your teeth.', ['Dragon Breath', 1, '🪰', { damage: 7, draw: 1, weaken: 1 }]),
  mon('krokorok',  'Krokorok',  'normal', 'desert', 'striker',   ['Bite', 'Torment', 'Foul Play'], 'Its eyes see through sandstorms. It sees you before you see it.', ['Swagger', 1, '🐊', { damage: 7, vulnerable: 1 }]),
  mon('hippowdon', 'Hippowdon', 'normal', 'desert', 'heavy',     ['Yawn', 'Bite', 'Earthquake'], 'Blasts sand from the holes on its back. Whole dunes move when it wakes.', ['Earth Power', 2, '🦛', { damage: 10, block: 8 }]),
  mon('solrock',   'Solrock',   'normal', 'desert', 'confuser',  ['Rock Throw', 'Morning Sun', 'Solar Beam'], 'Fell from the sky into the dunes. It glows hotter at noon.', ['Morning Sun', 1, '☀️', { heal: 5, draw: 1 }]),
  mon('lunatone',  'Lunatone',  'normal', 'desert', 'confuser',  ['Rock Throw', 'Cosmic Power', 'Psychic'], 'Floats over the dunes at full moon. Its eyes make you drowsy.', ['Psychic', 2, '🌙', { damage: 10, weaken: 2 }]),
  mon('cofagrigus','Cofagrigus','normal', 'desert', 'heavy',     ['Protect', 'Hex', 'Shadow Ball'], 'Looks like a golden coffin. Grave robbers who open it are never seen again.', ['Mummy', 1, '⚰️', { block: 9, weaken: 1 }]),
  mon('crustle',   'Crustle',   'grass',  'desert', 'tank',      ['Withdraw', 'Bug Bite', N('Rock Wrecker')], 'Carries a slab of rock around and fights to the death for a good one.', ['Shell Smash', 1, '🪨', { block: 4, strength: 2, selfDamage: 2 }, { exhaust: true }]),
  mon('cradily',   'Cradily',   'grass',  'desert', 'drainer',   ['Giga Drain', N('Ancient Power'), 'Energy Ball'], 'Roots in the dry sea bed, waiting for a tide that went out long ago.', ['Root Hold', 1, '🌿', { block: 5, seed: 2, heal: 2 }]),
  mon('archen',    'Archen',    'normal', 'desert', 'speedster', ['Quick Attack', 'Wing Attack', 'Ancient Power'], 'Restored from a fossil, it still cannot fly. It runs at things instead.', ['Head Smash', 1, '🦖', { damage: 12, selfDamage: 3 }]),
  mon('volcarona', 'Volcarona', 'fire',   'desert', 'bruiser',   ['Ember', N('Quiver Dance'), 'Fiery Dance'], 'When the dunes went dark one winter, it is said, its wings were the sun.', ['Fiery Dance', 2, '🦋', { damage: 8, burn: 3, strength: 1 }], { rare: true }),
  mon('gabite',    'Gabite',    'normal', 'desert', 'speedster', ['Sand Tomb', 'Dragon Claw', 'Dig'], 'Hoards shiny things in its cave. Its shed scales are said to be lucky.', ['Dual Chop', 1, '🦈', { damage: 5, hits: 2, vulnerable: 1 }], { rare: true }),
  /* ----- Batch 4: Meadow ----- */
  mon('bellossom', 'Bellossom', 'grass',  'meadow', 'confuser',  ['Magical Leaf', N('Sweet Scent'), 'Petal Dance'], 'Dances in the sun after rain. The flowers round it open to watch.', ['Petal Dance', 2, '🌺', { damage: 6, hits: 3, addCard: { id: 'confusion', n: 1, to: 'discard' } }]),
  mon('jumpluff',  'Jumpluff',  'grass',  'meadow', 'speedster', [N('Tackle'), 'Bullet Seed', 'Leaf Storm'], 'Drifts over the meadow on the warm wind, scattering cotton spores.', ['Cotton Guard', 1, '🌬️', { block: 6, blockNext: 5 }]),
  mon('lilligant', 'Lilligant', 'grass',  'meadow', 'paralyzer', ['Stun Spore', N('Quiver Dance'), 'Petal Blizzard'], 'Its flower smells so sweet that even grumpy Tauros calm down.', ['Quiver Dance', 1, '💃', { strength: 1, block: 5, weaken: 1 }]),
  mon('whimsicott','Whimsicott','grass',  'meadow', 'bruiser',   [N('Fairy Wind'), 'Cotton Guard', 'Energy Ball'], 'Slips into tents through the tiniest gap and leaves them full of fluff.', ['Tailwind', 0, '🐑', { draw: 2, weaken: 1 }, { exhaust: true }]),
  mon('ledian',    'Ledian',    'grass',  'meadow', 'striker',   ['Comet Punch', N('Swift'), 'Bug Buzz'], 'Flies by starlight. Its spots grow brighter on clear nights.', ['Comet Punch', 1, '🐞', { damage: 2, hits: 4, block: 2 }]),
  mon('beautifly', 'Beautifly', 'grass',  'meadow', 'drainer',   ['Absorb', N('Gust'), 'Giga Drain'], 'Sips nectar from the meadow flowers and fights anything that comes too close.', ['Silver Wind', 1, '🦋', { damage: 5, strength: 1 }, { exhaust: true }]),
  mon('politoed',  'Politoed',  'water',  'meadow', 'bruiser',   ['Bubble', N('Perish Song'), 'Hydro Pump'], 'Croaks from the meadow ponds when it rains. More frogs come when it calls.', ['Perish Song', 1, '🐸', { tide: 2, weaken: 2 }, { exhaust: true }]),
  mon('azumarill', 'Azumarill', 'water',  'meadow', 'tank',      ['Aqua Ring', N('Rollout'), 'Aqua Tail'], 'Listens at the riverbank with its long ears. It hears a Magikarp blink.', ['Aqua Ring', 1, '💧', { heal: 3, tide: 1, block: 5 }]),
  mon('pidgeotto', 'Pidgeotto', 'normal', 'meadow', 'striker',   ['Gust', 'Sand Attack', 'Twister'], 'Circles high over the grass and dives the moment a Rattata twitches.', ['Twister', 1, '🌪️', { damage: 3, hits: 2, weaken: 1 }]),
  mon('flaaffy',   'Flaaffy',   'normal', 'meadow', 'paralyzer', ['Thunder Shock', 'Cotton Spore', 'Thunder Punch'], 'Its bald patches spark. The fluff that is left is full of static.', ['Thunder Punch', 1, '👊', { damage: 7, weaken: 1, nextEnergy: 1 }]),
  mon('wigglytuff','Wigglytuff','normal', 'meadow', 'tank',      ['Defense Curl', 'Double Slap', 'Hyper Voice'], 'Puffs up to twice its size. Its fur is the softest in the Safari.', ['Defense Curl', 1, '🎈', { block: 10, draw: 1 }, { exhaust: true }]),
  mon('togetic',   'Togetic',   'normal', 'meadow', 'confuser',  ['Fairy Wind', 'Wish', 'Ancient Power'], 'Only seen by kind people, they say. It sprinkles them with good luck.', ['Wish', 1, '🌟', { heal: 5, blockNext: 6 }, { exhaust: true }], { rare: true }),
  mon('ampharos',  'Ampharos',  'normal', 'meadow', 'paralyzer', ['Thunder Wave', 'Charge', 'Thunderbolt'], 'The light on its tail can be seen from the far side of the Safari.', ['Thunderbolt', 2, '💡', { damage: 13, weaken: 1, draw: 1 }], { rare: true }),

  /* ----- Batch 4: Forest ----- */
  mon('venomoth',  'Venomoth',  'grass',  'forest', 'poisoner',  [N('Poison Powder'), N('Psychic'), 'Bug Buzz'], 'Shakes poisonous scales off its wings at night under the canopy.', ['Bug Buzz', 1, '🦟', { damage: 8, weaken: 1, sap: 1 }]),
  mon('breloom',   'Breloom',   'grass',  'forest', 'striker',   [N('Mach Punch'), 'Seed Bomb', N('Sky Uppercut')], 'Swings its short arms out like springs. The punch lands before you see it.', ['Mach Punch', 0, '🥊', { damage: 5, draw: 1 }, { exhaust: true }]),
  mon('shiftry',   'Shiftry',   'grass',  'forest', 'speedster', ['Razor Leaf', N('Feint Attack'), 'Leaf Blade'], 'Fans its leaf hands to raise a gale that strips the trees bare.', ['Leaf Tornado', 1, '🍃', { damage: 3, hits: 3, weaken: 1 }]),
  mon('vileplume', 'Vileplume', 'grass',  'forest', 'clogger',   ['Stun Spore', 'Mega Drain', 'Petal Blizzard'], 'Its petals are the biggest in the world. Its pollen makes you sneeze for days.', ['Stun Spore', 1, '🌼', { heal: 4, seed: 2, weaken: 1 }]),
  mon('metapod',   'Metapod',   'grass',  'forest', 'heavy',     ['Harden', N('Tackle'), 'Bug Bite'], 'Hangs very still from a branch. Inside, it is busy turning into something else.', ['Harden', 1, '🫛', { block: 8 }, { retain: true, growOnRetain: { block: 2 } }]),
  mon('forretress','Forretress','grass',  'forest', 'tank',      [N('Spikes'), 'Bug Bite', N('Gyro Ball')], 'Hides in a steel shell bolted to the tree trunk. Do not knock.', ['Spikes', 1, '📌', { damage: 3, block: 8 }]),
  mon('ariados',   'Ariados',   'grass',  'forest', 'poisoner',  [N('Poison Sting'), 'String Shot', 'X-Scissor'], 'Ties a thread to its prey and follows it home to the rest of its kind.', ['Spider Web', 1, '🕷️', { weaken: 1, vulnerable: 1, sap: 1 }, { exhaust: true }]),
  mon('sawsbuck',  'Sawsbuck',  'grass',  'forest', 'bruiser',   [N('Take Down'), 'Leech Seed', 'Horn Leech'], 'Leads the herd through the forest. Its antlers flower in the spring.', ['Horn Leech', 2, '🦌', { damage: 12, healDealt: true }]),
  mon('simisage',  'Simisage',  'grass',  'forest', 'striker',   ['Vine Whip', N('Fury Swipes'), 'Seed Bomb'], 'Swings through the trees with its spiky tail and whacks anything in the way.', ['Seed Bomb', 2, '🌰', { damage: 9, seed: 3 }]),
  mon('sudowoodo', 'Sudowoodo', 'normal', 'forest', 'heavy',     ['Block', 'Low Kick', 'Rock Slide'], 'Pretends to be a tree. It is not very good at it, but nobody says so.', ['Mimic Tree', 1, '🌳', { block: 7, vulnerable: 1 }]),
  mon('noctowl',   'Noctowl',   'normal', 'forest', 'confuser',  ['Peck', 'Reflect', 'Hypnosis'], 'Its eyes take in the faintest light. Nothing moves in the forest that it misses.', ['Night Shade', 1, '🌘', { damage: 4, drawPerDebuff: 1 }]),
  mon('scizor',    'Scizor',    'grass',  'forest', 'striker',   [N('Bullet Punch'), 'Fury Cutter', 'X-Scissor'], 'The eyes on its pincers scare off anything that sees them. Its steel body is hard to scratch.', ['Bullet Punch', 0, '🔩', { damage: 4, strength: 1 }, { exhaust: true }], { rare: true }),
  mon('vespiquen', 'Vespiquen', 'grass',  'forest', 'tank',      [N('Defend Order'), 'Attack Order', 'Bug Buzz'], 'Rules a hive in a hollow oak. Its grubs swarm out at its call.', ['Attack Order', 1, '🐝', { damage: 2, hits: 3, strength: 1 }], { rare: true }),

  /* ----- Batch 4: Wetland ----- */
  mon('poliwrath', 'Poliwrath', 'water',  'wetland', 'bruiser',  [N('Mach Punch'), N('Bulk Up'), 'Waterfall'], 'Swims across the whole lake without a rest. Its arms are pure muscle.', ['Dynamic Punch', 2, '🌀', { damage: 12, addCard: { id: 'confusion', n: 1, to: 'draw' }, vulnerable: 2 }]),
  mon('tentacruel','Tentacruel','water',  'wetland', 'poisoner', [N('Poison Jab'), 'Barrier', 'Hydro Pump'], 'Its tentacles stretch out under the water. Swimmers keep to the shallows.', ['Toxic Tentacles', 1, '🪼', { damage: 2, hits: 3, sap: 1 }]),
  mon('slowbro',   'Slowbro',   'water',  'wetland', 'heavy',    [N('Slack Off'), N('Headbutt'), 'Surf'], 'A Shellder bit its tail and never let go. Neither has noticed.', ['Slack Off', 1, '🐚', { heal: 6, block: 6 }, { exhaust: true }]),
  mon('mantine',   'Mantine',   'water',  'wetland', 'tank',     ['Aqua Ring', N('Wing Attack'), 'Bubble Beam'], 'Glides out of the lake and over the reeds. Remoraid ride along on its fins.', ['Air Glide', 1, '🌊', { block: 6, tide: 2 }]),
  mon('floatzel',  'Floatzel',  'water',  'wetland', 'speedster',[N('Quick Attack'), 'Aqua Jet', N('Crunch')], 'Floats on its collar and rescues anyone who falls in the lake.', ['Aqua Tail', 2, '🦦', { damage: 10, tide: 2 }]),
  mon('lumineon',  'Lumineon',  'water',  'wetland', 'confuser', ['Water Pulse', N('Attract'), 'Silver Wind'], 'Its fins glow at the bottom of the lake to lure food in the dark.', ['Water Pulse', 1, '🐠', { damage: 5, perTideHeld: 1 }]),
  mon('alomomola', 'Alomomola', 'water',  'wetland', 'drainer',  ['Wish', 'Aqua Jet', 'Scald'], 'Wraps hurt Pokémon in its fins and carries them back to the shore.', ['Healing Wish', 1, '💗', { heal: 8 }, { exhaust: true, retain: true }]),
  mon('huntail',   'Huntail',   'water',  'wetland', 'striker',  [N('Bite'), 'Water Pulse', N('Sucker Punch')], 'Lives in the deepest part of the lake. Its tail looks like a little fish.', ['Sucker Punch', 1, '🎣', { damage: 6, ifEnemyAttacks: { bonus: 5 } }]),
  mon('gorebyss',  'Gorebyss',  'water',  'wetland', 'drainer',  ['Whirlpool', N('Confusion'), 'Water Pulse'], 'Thin as a ribbon. It sips from other Pokémon with its fine mouth.', ['Whirlpool', 1, '🌀', { damage: 3, hits: 2, tide: 1, weaken: 1 }]),
  mon('cloyster',  'Cloyster',  'water',  'wetland', 'heavy',    ['Withdraw', 'Icicle Spear', 'Ice Beam'], 'Its shell is harder than diamond. Only its spikes ever come out.', ['Icicle Spear', 1, '🧊', { damage: 2, hits: 4, block: 3 }]),
  mon('yanmega',   'Yanmega',   'grass',  'wetland', 'speedster',[N('Air Slash'), 'Bug Bite', 'Bug Buzz'], 'Its wing beats can cut through the reeds. It carries a grown-up with ease.', ['Air Slash', 1, '🪰', { damage: 7, weaken: 1, discard: 1, draw: 1 }]),
  mon('tranquill', 'Tranquill', 'normal', 'wetland', 'striker',  ['Quick Attack', 'Air Cutter', 'Facade'], 'Nests on the lake\'s islands and always finds its way back, however far it flies.', ['Facade', 1, '🕊️', { damage: 5, ifHurt: { bonus: 6 } }]),
  mon('gyarados',  'Gyarados',  'water',  'wetland', 'bruiser',  [N('Bite'), N('Dragon Dance'), 'Aqua Tail'], 'Rose from the lake in a rage the year the Magikarp were overfished. It hasn\'t calmed down.', ['Thrash', 2, '🐲', { damage: 8, hits: 2, strength: 1, selfDamage: 3 }], { rare: true }),
  mon('milotic',   'Milotic',   'water',  'wetland', 'drainer',  ['Aqua Ring', N('Attract'), 'Hydro Pump'], 'Rises from the lake on calm days. Anyone who sees it forgets to be angry.', ['Recover', 1, '💠', { heal: 7, tide: 2 }, { exhaust: true }], { rare: true }),

  /* ----- Batch 4: Marsh ----- */
  mon('weepinbell','Weepinbell','grass',  'marsh', 'poisoner',   [N('Acid'), 'Growth', 'Razor Leaf'], 'Hangs from the marsh trees by its hook and spits acid at anything below.', ['Acid Spray', 0, '🔔', { damage: 2, vulnerable: 1, sap: 1 }, { exhaust: true }]),
  mon('victreebel','Victreebel','grass',  'marsh', 'drainer',    ['Vine Whip', 'Absorb', 'Leaf Blade'], 'Its sweet smell pulls bugs in. Bigger things too, when it is hungry.', ['Swallow Whole', 2, '🪤', { damage: 11, healDealt: true, weaken: 1 }]),
  mon('tangrowth', 'Tangrowth', 'grass',  'marsh', 'heavy',      ['Ingrain', 'Vine Whip', 'Power Whip'], 'Its vines grow back faster than you can cut them. The marsh is half Tangrowth.', ['Power Whip', 2, '🌿', { damage: 16, seed: 1 }]),
  mon('accelgor',  'Accelgor',  'grass',  'marsh', 'speedster',  [N('Acid Spray'), 'Bug Buzz', N('Quick Guard')], 'Shed its shell to go faster. It wraps itself up in mud to keep from drying out.', ['Final Gambit', 0, '🥷', { damage: 9, selfDamage: 5 }, { exhaust: true }]),
  mon('escavalier','Escavalier','grass',  'marsh', 'tank',       [N('Iron Defense'), 'Fury Cutter', 'Megahorn'], 'Wears a Shelmet\'s shell as armour and charges with its lances.', ['Iron Head', 2, '🛡️', { damage: 10, block: 9, weaken: 1 }]),
  mon('galvantula','Galvantula','grass',  'marsh', 'paralyzer',  [N('Electroweb'), 'String Shot', 'Bug Buzz'], 'Strings electric webs between the marsh trees. They buzz when touched.', ['Electroweb', 1, '🕸️', { damage: 3, hits: 2, weaken: 1, nextEnergy: 1 }]),
  mon('jellicent', 'Jellicent', 'water',  'marsh', 'drainer',    [N('Hex'), 'Water Spout', 'Brine'], 'Drifts through the flooded channels. Boats that cross its path go missing.', ['Water Spout', 2, '🎐', { damage: 6, perTideHeld: 2, tide: 1 }]),
  mon('slowking',  'Slowking',  'water',  'marsh', 'confuser',   ['Water Pulse', N('Calm Mind'), N('Psychic')], 'The Shellder on its head made it clever. It ponders the marsh all day.', ['Calm Mind', 1, '👑', { focus: 6, block: 5, draw: 1 }]),
  mon('drapion',   'Drapion',   'normal', 'marsh', 'bruiser',    ['Poison Fang', 'Hone Claws', 'Cross Poison'], 'Can crush a car in its claws, they say. It keeps to the deepest bogs.', ['Cross Poison', 1, '🦂', { damage: 7, sap: 1, vulnerable: 1 }]),
  mon('toxicroak', 'Toxicroak', 'normal', 'marsh', 'striker',    ['Poison Jab', 'Sucker Punch', 'Cross Chop'], 'Its knuckle claws are full of poison. A scratch hurts for a week.', ['Cross Chop', 2, '🤜', { damage: 14, focus: 4 }]),
  mon('skuntank',  'Skuntank',  'normal', 'marsh', 'clogger',    ['Toxic', 'Slash', 'Night Slash'], 'Sprays from its tail from fifty paces. The smell lingers over the marsh for days.', ['Stench', 1, '💨', { weaken: 3, block: 3 }, { exhaust: true }]),
  mon('dusclops',  'Dusclops',  'normal', 'marsh', 'heavy',      ['Confuse Ray', 'Shadow Punch', 'Night Shade'], 'Swallows will-o\'-wisps whole. What happens to them inside, nobody knows.', ['Shadow Punch', 1, '👻', { damage: 6, blockNext: 6 }]),
  mon('shedinja',  'Shedinja',  'grass',  'marsh', 'speedster',  [N('Shadow Sneak'), 'Fury Cutter', N('Grudge')], 'An empty shell that floats away on its own. Peer in the gap on its back and it peers back.', ['Wonder Guard', 1, '🪲', { endure: true, draw: 1 }, { exhaust: true }], { rare: true }),
  mon('zoroark',   'Zoroark',   'normal', 'marsh', 'confuser',   ['Feint Attack', 'Nasty Plot', 'Night Daze'], 'Shows travellers a path through the marsh that isn\'t there. Its pack lives in the illusion.', ['Night Daze', 2, '🦊', { damage: 12, vulnerable: 1, weaken: 1 }], { rare: true }),

  /* ----- Batch 4: Peak ----- */
  mon('dewgong',   'Dewgong',   'water',  'peak', 'tank',        [N('Rest'), 'Aurora Beam', 'Ice Beam'], 'Naps on the ice floes of the summit lake. The cold only makes it livelier.', ['Aurora Beam', 1, '🦭', { damage: 5, weaken: 1, block: 4 }]),
  mon('jynx',      'Jynx',      'water',  'peak', 'confuser',    ['Powder Snow', N('Lovely Kiss'), 'Ice Punch'], 'Sways its hips as it walks the snowfields. Some say it is singing.', ['Lovely Kiss', 1, '💄', { weaken: 3 }, { exhaust: true, retain: true }]),
  mon('vanillish', 'Vanillish', 'water',  'peak', 'tank',        ['Mist', 'Icy Wind', 'Avalanche'], 'Its snowy body never melts on the peak. Hikers keep their drinks cold on it.', ['Frost Breath', 1, '🍦', { damage: 4, block: 4, tide: 1 }]),
  mon('mamoswine', 'Mamoswine', 'water',  'peak', 'heavy',       [N('Mud Slap'), 'Ice Shard', N('Earthquake')], 'Walked off the glacier one spring after ten thousand years. It still looks cross.', ['Ice Shard', 0, '🦣', { damage: 5, block: 3 }, { exhaust: true }]),
  mon('froslass',  'Froslass',  'water',  'peak', 'confuser',    ['Icy Wind', N('Will-O-Wisp'), N('Shadow Ball')], 'Freezes lost climbers solid and keeps them in its ice cave. It hums as it works.', ['Icy Wind', 1, '👘', { damage: 3, weaken: 2, block: 4 }]),
  mon('ferrothorn','Ferrothorn','grass',  'peak', 'heavy',       [N('Iron Defense'), 'Power Whip', N('Gyro Ball')], 'Clings to the cave roofs and drops its iron spikes on anything that walks under.', ['Iron Barbs', 1, '🌵', { block: 9, blockDamage: true }]),
  mon('weavile',   'Weavile',   'normal', 'peak', 'speedster',   ['Night Slash', 'Ice Shard', 'Feint Attack'], 'Hunts the slopes in packs. They scratch signs in the ice to talk to each other.', ['Night Slash', 1, '🦡', { damage: 4, hits: 2, vulnerable: 1 }]),
  mon('skarmory',  'Skarmory',  'normal', 'peak', 'tank',        ['Steel Wing', 'Air Cutter', 'Drill Peck'], 'Nests in thornbushes on the cliffs. Its steel wings get battered sharp.', ['Steel Wing', 1, '🛩️', { damage: 6, block: 6 }, { exhaust: true }]),
  mon('makuhita',  'Makuhita',  'normal', 'peak', 'bruiser',     ['Arm Thrust', 'Bulk Up', 'Force Palm'], 'Trains by slapping the mountain trees. Some of them have fallen over.', ['Arm Thrust', 1, '🤚', { damage: 2, hits: 4 }, { retain: true }]),
  mon('lairon',    'Lairon',    'normal', 'peak', 'heavy',       ['Iron Defense', 'Headbutt', 'Iron Tail'], 'Charges into the cliffs to sharpen its armour. Rockfalls follow it.', ['Iron Tail', 2, '⚙️', { damage: 15, vulnerable: 1 }]),
  mon('gurdurr',   'Gurdurr',   'normal', 'peak', 'bruiser',     ['Low Kick', 'Bulk Up', 'Hammer Arm'], 'Carries a steel girder up the mountain. A team of grown-ups can\'t lift it.', ['Bulk Up', 1, '🏗️', { strength: 1, block: 7 }, { exhaust: true }]),
  mon('nosepass',  'Nosepass',  'normal', 'peak', 'tank',        ['Block', 'Rock Throw', 'Power Gem'], 'Its nose always points north. Lost climbers follow it home.', ['Rock Polish', 0, '🧭', { block: 3, draw: 1 }]),
  mon('glaceon',   'Glaceon',   'water',  'peak', 'striker',     ['Ice Shard', N('Bite'), 'Ice Fang'], 'Freezes its fur into needles. Snow falls around it even under a clear sky.', ['Ice Fang', 1, '🥶', { damage: 7, weaken: 1, block: 3 }], { rare: true }),
  mon('lucario',   'Lucario',   'normal', 'peak', 'striker',     ['Force Palm', 'Swords Dance', 'Aura Sphere'], 'Meditates on the summit at dawn. It can read your aura from the trailhead.', ['Aura Sphere', 1, '🔵', { damage: 9, draw: 1 }], { rare: true }),

  /* ----- Batch 4: Desert ----- */
  mon('kabuto',    'Kabuto',    'water',  'desert', 'tank',      ['Harden', N('Scratch'), 'Aqua Jet'], 'Revived from a fossil in the dry seabed. It still looks for the sea at night.', ['Harden Shell', 1, '🦀', { block: 7, tide: 1, draw: 1 }]),
  mon('omanyte',   'Omanyte',   'water',  'desert', 'confuser',  ['Water Gun', N('Withdraw'), N('Ancient Power')], 'Its spiral shell turns up in the dunes. Now and then one is still alive.', ['Spiral Shell', 1, '🐚', { block: 6, tide: 2, weaken: 1 }]),
  mon('tirtouga',  'Tirtouga',  'water',  'desert', 'tank',      [N('Withdraw'), 'Aqua Jet', N('Rock Slide')], 'Dug up where the desert used to be ocean. It dives into the sand as if it were water.', ['Shell Shield', 1, '🐢', { block: 9, tide: 1 }]),
  mon('relicanth', 'Relicanth', 'water',  'desert', 'heavy',     [N('Harden'), N('Head Smash'), 'Dive'], 'Has not changed in a hundred million years. It sees no reason to start now.', ['Head Smash', 2, '🗿', { damage: 18, selfDamage: 4 }]),
  mon('armaldo',   'Armaldo',   'grass',  'desert', 'heavy',     [N('Protect'), 'X-Scissor', N('Rock Blast')], 'Its armour is hard as a castle wall. It walks the dunes like it owns them.', ['X-Scissor', 1, '⚔️', { damage: 5, hits: 2, block: 3 }]),
  mon('durant',    'Durant',    'grass',  'desert', 'speedster', [N('Metal Claw'), 'Bug Bite', N('Iron Head')], 'March in long columns under the dunes. Heatmor follow them for supper.', ['Metal Claw', 1, '🐜', { damage: 5, strength: 1, block: 2 }]),
  mon('scolipede', 'Scolipede', 'grass',  'desert', 'poisoner',  [N('Poison Tail'), 'Steamroller', 'Megahorn'], 'Coils up and rolls down the dunes at frightening speed.', ['Steamroller', 2, '🐛', { damage: 12, sap: 2 }]),
  mon('krookodile','Krookodile','normal', 'desert', 'striker',   ['Crunch', 'Sand Tomb', 'Earthquake'], 'Its eyes zoom in on prey a mile off. Sandstorms do not bother it at all.', ['Crunch', 1, '🐊', { damage: 8, vulnerable: 1, weaken: 1 }, { exhaust: true }]),
  mon('donphan',   'Donphan',   'normal', 'desert', 'heavy',     ['Defense Curl', 'Rollout', 'Earthquake'], 'Curls into a ball and rolls over the dunes. It can knock a house down.', ['Rollout', 1, '🐘', { damage: 5, block: 3 }, { retain: true, growOnRetain: { damage: 3 } }]),
  mon('cranidos',  'Cranidos',  'normal', 'desert', 'bruiser',   ['Headbutt', 'Scary Face', 'Zen Headbutt'], 'Revived from a fossil skull. It head-butts the dune walls for fun.', ['Zen Headbutt', 1, '🦕', { damage: 9, selfDamage: 2 }]),
  mon('shieldon',  'Shieldon',  'normal', 'desert', 'tank',      ['Iron Defense', 'Tackle', 'Ancient Power'], 'Its face is a shield. It digs for roots with its back to the wind.', ['Metal Burst', 1, '🛡️', { block: 7, blockDamage: true }]),
  mon('flygon',    'Flygon',    'normal', 'desert', 'speedster', ['Sand Tomb', 'Dragon Breath', 'Dragon Claw'], 'Its wings whip up the sandstorms that hide it. People call it the desert spirit.', ['Dragon Claw', 1, '🐉', { damage: 6, hits: 2 }, { exhaust: true }], { rare: true }),
  mon('kabutops',  'Kabutops',  'water',  'desert', 'striker',   ['Aqua Jet', N('Slash'), 'Waterfall'], 'Its scythes were made for the sea. In the desert it cuts through dunes instead.', ['Razor Shell', 1, '🗡️', { damage: 8, tide: 1, vulnerable: 1 }], { rare: true }),
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
