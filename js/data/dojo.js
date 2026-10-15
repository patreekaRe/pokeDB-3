/* ============================================================
   dojo.js  -  Chad Master Kenmatta's dojo in the Whispering Clearing (docs/roadmap.md's "Kenmatta's dojo opens", the
   user's picks, 2026-10-15): the belts, the combo trial ladder and the dojo's furniture set. Nothing here makes a run
   stronger. Kept free of the DOM so node tests can read it.

   A trial is a puzzle fight on the battle screen, never a run: a set Pokémon, a set deck drawn in order (`deck[0]`
   first, five a turn), a set foe whose moves go in order from the first, and a goal. One star a clear, kept in
   `save.dojo.stars`; a trial opens once the one before it is cleared. Belts are worked out from the stars and from
   beating Kenmatta in runs (`save.kenWins`), so they never go down; `save.dojo.belt` is only the last belt he has
   handed you (the ceremony, once a belt). The furniture comes with a belt or a number of stars (js/data/furniture.js's
   `dojo` source), so it is never saved of its own either.
   ============================================================ */

/** The belts, white to black: the stars and the run wins against him each needs. Set for the full ladder of about 20
    trials (the first 14 so far), so a later trial never takes a belt or a piece of furniture back. `line` is what he
    says as he ties it on; `talk` joins his idle lines from that belt on. */
export const BELTS = [
  { id: 'white', name: 'White Belt', colour: '#f4f2ea', knot: '#c8c4b8', stars: 0, wins: 0,
    line: 'Every legend starts with a white belt, bro. Even me. For like a day.',
    talk: ['Welcome to the dojo, bro. Shoes off. Ego off. Actually keep the ego, you\'ll need it.', 'The trials are on the board. Clear one, get a star. Stars make belts. Belts make chads.',
      'See the ring? Every great fighter has stood in it. Mostly me. I am every great fighter.', 'Gold leaf on the walls. Did I need it? No. Do I deserve it? Every day, bro.'] },
  { id: 'yellow', name: 'Yellow Belt', colour: '#f8d838', knot: '#c8a018', stars: 2, wins: 0,
    line: 'Yellow belt. You can count damage AND read a move. Lowkey impressive for a beta.',
    talk: ['Yellow belt energy. I can feel it from here. It\'s faint, but it\'s there.'] },
  { id: 'green', name: 'Green Belt', colour: '#48b048', knot: '#2a7a2a', stars: 4, wins: 1,
    line: 'You beat me out there AND cleared my trials? Green belt. Don\'t let it go to your head. Let it go to your biceps.',
    talk: ['Green belt. You\'ve tasted my Mata Chop and lived. Respect.', 'Real ones train between runs. You\'re a real one now. Ish.'] },
  { id: 'blue', name: 'Blue Belt', colour: '#3a78d8', knot: '#1e4a98', stars: 8, wins: 2,
    line: 'Blue belt, bro. Halfway to me. The other half is the hard half. FORTIFY YOUR MIND.',
    talk: ['Blue belt. The students are scared of you now. Good.', 'Some days I fight the sandbag. Some days the sandbag fights me. Blue belts know.'] },
  { id: 'brown', name: 'Brown Belt', colour: '#8a5428', knot: '#5a3214', stars: 14, wins: 3,
    line: 'Brown belt. One step from black. I can see the Mata-Mindset in your eyes, bro.',
    talk: ['Brown belt. My Dragonite medallion nods at you when you walk in. I saw it.'] },
  { id: 'black', name: 'Black Belt', colour: '#22222a', knot: '#0c0c10', stars: 20, wins: 5,
    line: 'Black belt. You did it, bro. You\'re a chad now. Officially. I\'m literally tearing up. It\'s sweat. It\'s sweat.',
    talk: ['Black belt. We\'re equals now. I\'m still more equal, though.', 'You and me, bro. Two chads. One dojo. TEST YOUR MIGHT.'] },
];

/** The dojo's own Pokémon in the trials (his students), a training foe: typeless on the mat, its moves in order. */
const foe = (id, name, hp, moves, more = {}) => ({ id, name, type: 'normal', hp, image: `assets/pokemon/${id}-front.gif`, art: false, spriteId: id, arena: 'kombat', music: 'kombat', moves, ...more });

/** Goals: `turns` win by the end of that turn of yours (it's lost the moment the next one would start); `noDamage` never
    lose HP; `burn` the last blow is Burn; `full` win at full HP (Overgrow's heal counts). */
export const TRIALS = [
  { id: 't1', name: 'Count It Out', starter: 'charmander', hp: 30, goal: { turns: 1 }, goalText: 'Win in 1 turn.',
    tip: 'Machop has 28 HP and 3 PP to beat it with. Add it up before you swing.',
    before: ['Trial one, bro. Machop has 28 HP. You have one turn. Do the math, then do the damage.'],
    after: 'Clean. Math is just punching with numbers, bro.', fail: 'Close! Count again. Every PP is a punch.',
    foe: foe('machop', 'Machop', 28, [{ kind: 'attack', name: 'Karate Chop', amount: 6 }]),
    deck: ['ember', 'fire-punch', 'ember', 'quick-attack', 'tackle', 'flame-wall', 'flame-wall', 'ember', 'ember', 'flame-wall'] },
  { id: 't2', name: 'Don\'t Get Hit', starter: 'squirtle', hp: 30, goal: { noDamage: true, turns: 3 }, goalText: 'Win within 3 turns without losing any HP.',
    tip: 'Mankey hits for 10 every turn. Block all of it, and hit back with what\'s left.',
    before: ['Defense wins fights, bro. Mankey swings for 10, every turn. Don\'t let a single point through.'],
    after: 'Not a scratch. That\'s the Mata-Mindset: they can\'t hurt what they can\'t hit.', fail: 'You got hit, bro. Block first, punch second.',
    foe: foe('mankey', 'Mankey', 30, [{ kind: 'attack', name: 'Scratch', amount: 10 }]),
    deck: ['withdraw', 'splash', 'water-gun', 'water-pulse', 'water-gun', 'dive', 'splash', 'crabhammer', 'withdraw', 'water-gun', 'splash', 'withdraw', 'water-gun', 'water-gun', 'withdraw'] },
  { id: 't3', name: 'Slow Burn', starter: 'charmander', hp: 30, goal: { burn: true, turns: 3 }, goalText: 'Finish Tyrogue with Burn, within 3 turns.',
    tip: 'Burn hits at the start of its turn. If an attack lands the last blow, the trial fails.',
    before: ['Patience, bro. Tyrogue goes down to Burn, not to your fists. Let it cook.'],
    after: 'Cooked. Medium rare. You let the fire do the work. Big brain.', fail: 'Your fists finished it, bro. The fire had to.',
    foe: foe('tyrogue', 'Tyrogue', 40, [{ kind: 'attack', name: 'Tackle', amount: 5 }]),
    deck: ['will-o-wisp', 'fire-spin', 'ember', 'flare', 'flame-wall', 'fan-the-flames', 'ember', 'flame-wall', 'ember', 'flare', 'flame-wall', 'flame-wall', 'flare', 'ember', 'flame-wall'] },
  { id: 't4', name: 'Order Matters', starter: 'squirtle', hp: 30, goal: { turns: 1 }, goalText: 'Win in 1 turn.',
    tip: 'Torrent starts you on 2 Tide. Water Sport adds 2, Swift Swim doubles it. Which first?',
    before: ['Same moves, different order, different result, bro. Poliwrath has 55 HP. One turn.'],
    after: 'Stack it, double it, send it. That\'s how a tide becomes a tsunami.', fail: 'Right moves, wrong order. Think about what doubles what.',
    foe: foe('poliwrath', 'Poliwrath', 55, [{ kind: 'attack', name: 'Mach Punch', amount: 8 }]),
    deck: ['hydro-pump', 'swift-swim', 'water-gun', 'water-sport', 'withdraw', 'withdraw', 'water-gun', 'splash', 'withdraw', 'splash'] },
  { id: 't5', name: 'Strength Training', starter: 'bulbasaur', hp: 40, goal: { turns: 1 }, goalText: 'Win in 1 turn.',
    tip: 'Power Whip counts your Strength three times. Rototiller\'s lasts the turn.',
    before: ['Leg day, arm day, Power Whip day. Hitmonchan has 29 HP. Get swole, then get it done.'],
    after: 'Swole and done. Strength times three, bro. That\'s just science.', fail: 'Not swole enough. Pump up first, then whip.',
    foe: foe('hitmonchan', 'Hitmonchan', 29, [{ kind: 'attack', name: 'Mach Punch', amount: 7 }]),
    deck: ['power-whip', 'rototiller', 'vine-whip', 'swords-dance', 'growth', 'cotton-guard', 'vine-whip', 'cotton-guard', 'vine-whip', 'cotton-guard'] },
  { id: 't6', name: 'Glass Cannon', starter: 'charmander', hp: 24, maxHp: 40, goal: { turns: 1 }, goalText: 'Win in 1 turn.',
    tip: 'Below half HP (under 20), Blaze adds 3 to every attack, and Flare Up hits harder still.',
    before: ['Pain is power, bro. You\'re on 24 of 40. Primeape has 69 HP. Get low, then go off.'],
    after: 'Down bad and still won. That\'s the most chad thing you can do.', fail: 'Get below half FIRST, bro. Then every hit burns.',
    foe: foe('primeape', 'Primeape', 69, [{ kind: 'attack', name: 'Thrash', amount: 9 }]),
    deck: ['flare-up', 'fire-punch', 'fiery-dance', 'ember', 'flare-blitz', 'flame-wall', 'flame-wall', 'ember', 'flame-wall', 'ember'] },
  { id: 't7', name: 'Seed and Heal', starter: 'bulbasaur', hp: 25, maxHp: 40, goal: { full: true, turns: 3 }, goalText: 'Win within 3 turns at full HP.',
    tip: 'Leech Seed drains it at the start of its turn and heals you. Overgrow heals 3 more once you win.',
    before: ['You\'re hurt, bro. 25 of 40. Beat Makuhita and walk out at full HP. Recovery is training too.'],
    after: 'Full HP, full send. Rest days are gains days, bro.', fail: 'You won, but you\'re not at full. Heal up before the last blow.',
    foe: foe('makuhita', 'Makuhita', 24, [{ kind: 'attack', name: 'Arm Thrust', amount: 6 }]),
    deck: ['worry-seed', 'snap-trap', 'cotton-guard', 'absorb', 'leaf-guard', 'mega-drain', 'synthesis', 'cotton-guard', 'absorb', 'vine-whip', 'leaf-guard', 'synthesis', 'absorb', 'vine-whip', 'cotton-guard'] },
  { id: 't8', name: 'Kenmatta\'s Test', starter: 'charmander', hp: 40, goal: { turns: 3 }, goalText: 'Beat Kenmatta within 3 turns.',
    tip: 'Burn him early. Fan the Flames doubles it, and Inferno hits harder for every Burn.',
    before: ['Trial eight. Me, bro. Three turns. Everything you\'ve learned. TEST YOUR MIGHT!'],
    after: 'You... beat me. In my own dojo. FORTIFY... my... mind... Respect, bro. Real respect.', fail: 'Skill issue. Three turns, bro. Burn me early.',
    foe: { id: 'ken', name: 'Chad Master Kenmatta', type: 'normal', hp: 90, image: 'assets/trainers/alder.png', art: false, arena: 'kombat', music: 'kombat', aura: true,
      intro: 'Chad Master Kenmatta steps onto the mat!',
      taunts: { half: '"Bro, that was a warm-up."', low: '"Okay, okay, you got some moves..."', win: '"Skill issue."' },
      moves: [{ kind: 'attack', name: 'Mata Chop', amount: 9 }, { kind: 'buff', name: 'Mata-Manspread', amount: 2 }, { kind: 'attack', name: 'Kraber Crush', amount: 12 }] },
    deck: ['will-o-wisp', 'fire-spin', 'ember', 'scorch', 'flame-wall', 'inferno', 'fire-punch', 'fan-the-flames', 'heat-up', 'ember', 'flare-up', 'fire-punch', 'flame-wall', 'ember', 'flare', 'ember', 'flame-wall'] },
  { id: 't9', name: 'Hold the Wave', starter: 'squirtle', hp: 30, goal: { turns: 2 }, goalText: 'Win in 2 turns.',
    tip: 'Tide lasts all fight, and Water Pulse stays in your hand when your turn ends.',
    before: ['Trial nine, bro. Mienfoo has 50 HP and you get two turns. The wave you hold hits harder than the wave you throw.'],
    after: 'You held it. You held it! That\'s discipline, bro. That\'s a whole tsunami of discipline.', fail: 'You threw the wave too early, bro. Hold Water Pulse, build the Tide, THEN send it.',
    foe: foe('mienfoo', 'Mienfoo', 50, [{ kind: 'attack', name: 'Fake Out', amount: 6 }, { kind: 'attack', name: 'Drain Punch', amount: 8 }]),
    deck: ['water-pulse', 'water-gun', 'rain-dance', 'water-sport', 'withdraw', 'sparkling-aria', 'swift-swim', 'dive', 'splash', 'withdraw', 'splash', 'withdraw', 'splash', 'water-gun', 'withdraw'] },
  { id: 't10', name: 'Through the Guard', starter: 'charmander', hp: 40, goal: { turns: 3 }, goalText: 'Win within 3 turns.',
    tip: 'Hitmontop\'s Detect soaks up your hits on turn 3, but Burn goes right through it. Inferno Charge pays you back next turn.',
    before: ['Hitmontop has 130 HP, bro, and on turn three it Detects everything you throw. Everything with fists, anyway.'],
    after: 'It blocked your fists and burned anyway. Fire doesn\'t knock, bro. It just comes in.', fail: 'Detect ate your hits, bro. Stack the Burn early, spend the PP you banked.',
    foe: foe('hitmontop', 'Hitmontop', 130, [{ kind: 'attack', name: 'Rolling Kick', amount: 7 }, { kind: 'defend', name: 'Detect', amount: 40 }, { kind: 'attack', name: 'Triple Kick', amount: 9 }]),
    deck: ['will-o-wisp', 'inferno-charge', 'fire-spin', 'ember', 'flame-wall', 'flame-burst', 'flame-burst', 'fire-lash', 'ember', 'flame-wall', 'fan-the-flames', 'fan-the-flames', 'ember', 'flare', 'flame-wall'] },
  { id: 't11', name: 'Tide and Seed', starter: 'squirtle', hp: 21, maxHp: 30, goal: { full: true, turns: 3 }, goalText: 'Win within 3 turns at full HP.',
    tip: 'Leech Seed heals you as it drains, and Energy Ball heals once it\'s seeded. Spend your Tide on Tidal Wall first and Hydro Pump last.',
    before: ['I lent you some Grass moves, bro. Breloom has 56 HP, you\'re on 21 of 30. Walk out at full. Water and seeds, together.'],
    after: 'Tide for the shield, seeds for the heal, then the pump. That\'s a whole ecosystem, bro.', fail: 'Not full, bro. Let the seeds heal you, block every punch, and finish last.',
    foe: foe('breloom', 'Breloom', 56, [{ kind: 'attack', name: 'Mach Punch', amount: 10 }, { kind: 'attack', name: 'Sky Uppercut', amount: 12 }, { kind: 'attack', name: 'Focus Punch', amount: 14 }]),
    deck: ['worry-seed', 'tidal-wall', 'water-sport', 'water-gun', 'withdraw', 'snap-trap', 'rain-dance', 'withdraw', 'hydro-pump', 'splash', 'energy-ball', 'swift-swim', 'hydro-pump', 'water-gun', 'aqua-ring'] },
  { id: 't12', name: 'Patience', starter: 'bulbasaur', hp: 40, goal: { turns: 3 }, goalText: 'Win within 3 turns.',
    tip: 'Solar Blade stays in your hand and counts your Strength four times. Grow for two turns, then swing once.',
    before: ['Machamp has 116 HP, bro. Four arms. You have one blade. Make it count.'],
    after: 'Two turns of pumping, one swing. That\'s the chad way: patience, then violence.', fail: 'You swung too early, bro. Solar Blade waits. Let it.',
    foe: foe('machamp', 'Machamp', 116, [{ kind: 'attack', name: 'Karate Chop', amount: 8 }, { kind: 'attack', name: 'Revenge', amount: 10 }, { kind: 'attack', name: 'Cross Chop', amount: 12 }]),
    deck: ['solar-blade', 'swords-dance', 'growth', 'cotton-guard', 'vine-whip', 'leaf-blade', 'growth', 'trailblaze', 'leaf-guard', 'vine-whip', 'growth-spurt', 'rototiller', 'vine-whip', 'power-whip', 'leaf-guard'] },
  { id: 't13', name: 'Take the Hit', starter: 'charmander', hp: 32, goal: { turns: 2 }, goalText: 'Win in 2 turns.',
    tip: 'Heavy Slam hits for 60, more than you have. Endure keeps you on 1 HP, and Blaze loves 1 HP.',
    before: ['Hariyama hits for 60, bro. You have 32. Block it and you\'re slow. Take it, and you\'re dangerous.'],
    after: 'One HP and a full send. That\'s the most chad thing I\'ve ever seen. Again.', fail: 'Blocking won\'t save you here, bro. Endure it, then hit back with everything.',
    foe: foe('hariyama', 'Hariyama', 50, [{ kind: 'attack', name: 'Heavy Slam', amount: 60 }, { kind: 'attack', name: 'Arm Thrust', amount: 12 }]),
    deck: ['endure', 'heat-up', 'ember', 'flame-wall', 'flame-wall', 'flare-up', 'fire-punch', 'ember', 'ember', 'flame-wall', 'ember', 'flame-wall', 'ember', 'flame-wall', 'ember'] },
  { id: 't14', name: 'Kenmatta\'s Second Test', starter: 'squirtle', hp: 30, goal: { noDamage: true, turns: 3 }, goalText: 'Beat Kenmatta within 3 turns without losing any HP.',
    tip: 'He FORTIFIES first: a free turn. With Riptide and Hydration up, every card you play blocks, and every block hits him.',
    before: ['Trial fourteen. Me again, bro. 115 HP, three turns, and you don\'t get to touch me. I mean, I don\'t get to touch YOU. FORTIFY YOUR MIND!'],
    after: 'Your shield hit harder than my fists. In MY dojo. That\'s the Mata-Mindset, bro. You get it now. You really get it.', fail: 'Skill issue, bro. Set up while I fortify, then let your shield do the punching.',
    foe: { id: 'ken', name: 'Chad Master Kenmatta', type: 'normal', hp: 115, image: 'assets/trainers/alder.png', art: false, arena: 'kombat', music: 'kombat', aura: true,
      intro: 'Chad Master Kenmatta steps onto the mat! Again!',
      taunts: { half: '"Bro, your SHIELD is hitting me?"', low: '"This is... this is the Mata-Mindset..."', win: '"Skill issue."' },
      moves: [{ kind: 'defend', name: 'FORTIFY YOUR MIND', amount: 20, sound: 'fortify' }, { kind: 'attack', name: 'Kraber Crush', amount: 14 }, { kind: 'attack', name: 'TEST YOUR MIGHT', amount: 24, say: 'TEST YOUR MIGHT!' }] },
    deck: ['riptide', 'hydration', 'withdraw', 'water-gun', 'splash', 'shelter', 'withdraw', 'splash', 'aqua-veil', 'water-gun', 'splash', 'razor-shell', 'bubble-shield', 'withdraw', 'water-gun', 'withdraw', 'water-gun', 'splash', 'withdraw', 'water-gun'] },
];
export const TRIALS_BY_ID = Object.fromEntries(TRIALS.map(t => [t.id, t]));

/** The dojo's furniture set (js/data/furniture.js's `dojo` source): each with a belt, or a number of stars. */
export const DOJO_REWARDS = [
  { kind: 'kenposter', stars: 1 },
  { kind: 'dojomat', belt: 'yellow' },
  { kind: 'wingchun', belt: 'green' },
  { kind: 'dragonitemedal', stars: 6 },
  { kind: 'kensandbag', belt: 'blue' },
  { kind: 'dojogong', belt: 'brown' },
  { kind: 'blackbelttrophy', belt: 'black' },
];
export const DOJO_REWARD = Object.fromEntries(DOJO_REWARDS.map(r => [r.kind, r]));

/** The save's dojo, normalised: { stars: trial ids cleared, belt: the last belt handed over (an index), met }. */
export const dojoOf = (save) => ({ stars: [], belt: 0, met: false, ...(save?.dojo || {}) });

/** Stars won (only trials that exist). */
export const starsOf = (save) => dojoOf(save).stars.filter(id => TRIALS_BY_ID[id]).length;

/** Wins against him in runs (an old save's `kenBeaten` counts as three, as the badges read it). */
export const kenWinsOf = (save) => Math.max(save?.kenWins || 0, save?.kenBeaten ? 3 : 0);

/** The belt the save has earned: the highest whose stars and wins are both met (an index into BELTS). */
export function beltOf(save) {
  const s = starsOf(save), w = kenWinsOf(save);
  let at = 0;
  BELTS.forEach((b, i) => { if (s >= b.stars && w >= b.wins) at = i; });
  return at;
}

/** What the next belt still needs, or null at black: { belt, stars, wins } still to get. */
export function nextBelt(save) {
  const at = beltOf(save), next = BELTS[at + 1];
  if (!next) return null;
  return { belt: next, stars: Math.max(0, next.stars - starsOf(save)), wins: Math.max(0, next.wins - kenWinsOf(save)) };
}

/** Is a dojo piece earned? */
export function dojoEarned(save, kind) {
  const r = DOJO_REWARD[kind];
  if (!r) return false;
  return r.belt ? beltOf(save) >= BELTS.findIndex(b => b.id === r.belt) : starsOf(save) >= r.stars;
}

/** How a dojo piece is earned, for the base's Shop. */
export function dojoHow(kind, save) {
  const r = DOJO_REWARD[kind];
  if (!r) return '';
  if (r.stars) return `Win ${r.stars === 1 ? 'a star' : `${r.stars} stars`} in Kenmatta's dojo, in the Whispering Clearing (${Math.min(starsOf(save), r.stars)}/${r.stars})`;
  const b = BELTS.find(x => x.id === r.belt);
  return `Earn the ${b.name} in Kenmatta's dojo: ${b.stars} stars${b.wins ? ` and ${b.wins} win${b.wins === 1 ? '' : 's'} against him in runs` : ''}`;
}

/** Is a trial open (the first, or the one before it cleared)? */
export const trialOpen = (save, i) => i === 0 || dojoOf(save).stars.includes(TRIALS[i - 1]?.id);

/** Did a trial's result meet its goal? `result` is the battle's onEnd(). Returns null if it did, else why not. */
export function trialMissed(trial, result) {
  const g = trial.goal;
  if (result.trialFailed) return result.trialFailed;
  if (!result.won) return 'fainted';
  if (g.turns && result.turns > g.turns) return 'turns';
  if (g.noDamage && result.damageTaken > 0) return 'hit';
  if (g.burn && result.felledBy !== 'burn') return 'burn';
  if (g.full && result.hp < result.maxHp) return 'full';
  return null;
}

/** His idle lines at a belt: every line unlocked up to it. */
export const kenTalk = (belt) => BELTS.slice(0, belt + 1).flatMap(b => b.talk);
