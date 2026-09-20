/* ============================================================
   enemies.js  -  the wild monsters you fight.

   Each enemy has a "moves" list. On its turn it uses the next move in
   the list, then loops back to the start. The move it will use next is
   shown above its head (the "intent"), so you can plan your turn.

   Move kinds:
     attack    hit the player for `amount` damage
     drain     hit the player for `amount` and heal itself by `heal`
     defend    gain `amount` block
     buff      gain `amount` strength (all its attacks hit harder)
   ============================================================ */

export const ENEMIES = [
  {
    id: 'ashroot',
    name: 'Ashroot',
    type: 'grass',
    hp: 70,
    image: 'assets/enemies/ashroot.jpg',
    backdrop: 'assets/backgrounds/shrine.jpg',
    description: 'A sneaky vine beast from the roots of the Lost Wilds.',
    moves: [
      { kind: 'attack', name: 'Vine Whip', amount: 9 },
      { kind: 'drain',  name: 'Drain',     amount: 7, heal: 7 },
      { kind: 'attack', name: 'Root Slam', amount: 15 },
    ],
  },
  {
    id: 'blazeclaw',
    name: 'Blazeclaw',
    type: 'fire',
    hp: 90,
    image: 'assets/enemies/blazeclaw.jpg',
    backdrop: 'assets/backgrounds/volcano.jpg',
    description: 'An aggressive predator with blazing strikes.',
    moves: [
      { kind: 'attack', name: 'Scratch',    amount: 10 },
      { kind: 'buff',   name: 'Roar',       amount: 3 },
      { kind: 'attack', name: 'Flame Claw', amount: 15 },
    ],
  },
  {
    id: 'aquaeye',
    name: 'Aquaeye',
    type: 'water',
    hp: 80,
    image: 'assets/enemies/aquaeye.jpg',
    backdrop: 'assets/backgrounds/clearing.jpg',
    description: 'Floods the battlefield and hides behind waves.',
    moves: [
      { kind: 'attack', name: 'Bubble',     amount: 8 },
      { kind: 'defend', name: 'Wave Shield', amount: 10 },
      { kind: 'attack', name: 'Wave Crash', amount: 14 },
    ],
  },
];

export const ENEMIES_BY_ID = Object.fromEntries(ENEMIES.map(e => [e.id, e]));

/** Pick a random enemy. */
export function randomEnemy() {
  return ENEMIES[Math.floor(Math.random() * ENEMIES.length)];
}
