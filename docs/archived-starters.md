# Archived: the six non-Kanto starter decks

**Not used by the game right now.** This is a copy-paste-back reference in
case the 9-distinct-decks design comes back later. Nothing here is imported
by any live code, so deleting or editing this file has zero effect on the
game.

Why it exists: on 2026-09-22 we discussed shrinking the roster from 9 fully
balanced decks down to 3 ("Charmander/Bulbasaur/Squirtle" as the only
gameplay-distinct characters) with the other 6 becoming cosmetic skins that
reuse their type's deck. If that happens, `js/data/starters.js` and
`js/data/achievements.js` get simplified and this content is removed from
there — this file is the backup.

Sprites for all six (`assets/pokemon/{id}-front.gif` / `-back.gif`, and their
evolutions) already exist regardless of this decision — they were downloaded
for the roster before any of this and work fine as skin art too.

The **type cards** these decks reference (`ember`, `vine-whip`, `water-gun`,
etc.) and the **evolution cards** (mid/high tier) are shared by type, not
by starter — those stay in `js/data/cards.js` either way and don't need
archiving.

---

## Cyndaquil line (fire)
```js
{
  id: 'cyndaquil', type: 'fire',
  line: [
    { id: 'cyndaquil',  name: 'Cyndaquil' },
    { id: 'quilava',    name: 'Quilava' },
    { id: 'typhlosion', name: 'Typhlosion' },
  ],
  blurb: 'A burn specialist that sets enemies ablaze.',
  deck: ['ember', 'ember', 'fire-spin', 'scorch', 'heat-up', 'inferno-charge', 'flame-wall', 'block', 'tailwind', 'smokescreen'],
},
```
Achievement it was gated behind: *Defeat the Biome 2 boss.*

## Chikorita line (grass)
```js
{
  id: 'chikorita', type: 'grass',
  line: [
    { id: 'chikorita', name: 'Chikorita' },
    { id: 'bayleef',   name: 'Bayleef' },
    { id: 'meganium',  name: 'Meganium' },
  ],
  blurb: 'A healer. Wins long fights by outlasting enemies.',
  deck: ['vine-whip', 'vine-whip', 'absorb', 'absorb', 'synthesis', 'razor-leaf', 'stun-spore', 'block', 'block', 'tailwind'],
},
```
Achievement it was gated behind: *Defeat the Biome 1 boss (Snorlax).*

## Totodile line (water)
```js
{
  id: 'totodile', type: 'water',
  line: [
    { id: 'totodile',   name: 'Totodile' },
    { id: 'croconaw',   name: 'Croconaw' },
    { id: 'feraligatr', name: 'Feraligatr' },
  ],
  blurb: 'A hard hitter with a big Surf.',
  deck: ['water-gun', 'water-gun', 'surf', 'surf', 'bubble', 'rain-dance', 'withdraw', 'block', 'block', 'tailwind'],
},
```
Achievement it was gated behind: *Win a full run.*

## Torchic line (fire)
```js
{
  id: 'torchic', type: 'fire',
  line: [
    { id: 'torchic',   name: 'Torchic' },
    { id: 'combusken', name: 'Combusken' },
    { id: 'blaziken',  name: 'Blaziken' },
  ],
  blurb: 'An aggressive glass cannon. Hits fast and hits hard.',
  deck: ['ember', 'ember', 'ember', 'flare-up', 'inferno-charge', 'heat-up', 'flame-wall', 'scorch', 'block', 'tailwind'],
},
```
Achievement it was gated behind: *Defeat a boss without taking any damage.*

## Treecko line (grass)
```js
{
  id: 'treecko', type: 'grass',
  line: [
    { id: 'treecko',  name: 'Treecko' },
    { id: 'grovyle',  name: 'Grovyle' },
    { id: 'sceptile', name: 'Sceptile' },
  ],
  blurb: 'Quick and tricky, with guards and debuffs.',
  deck: ['vine-whip', 'vine-whip', 'vine-whip', 'razor-leaf', 'growth', 'absorb', 'quick-guard', 'block', 'smokescreen', 'tailwind'],
},
```
Achievement it was gated behind: *Win a run without visiting a rest site.*

## Mudkip line (water)
```js
{
  id: 'mudkip', type: 'water',
  line: [
    { id: 'mudkip',    name: 'Mudkip' },
    { id: 'marshtomp', name: 'Marshtomp' },
    { id: 'swampert',  name: 'Swampert' },
  ],
  blurb: 'A sturdy tank that weakens what it can\'t outdamage.',
  deck: ['water-gun', 'water-gun', 'water-gun', 'whirlpool', 'withdraw', 'withdraw', 'surf', 'bubble', 'quick-guard', 'block'],
},
```
Achievement it was gated behind: *Win a run with each Kanto starter.*

---

## The full achievement list, as it stood

```js
export const ACHIEVEMENTS = [
  { starter: 'chikorita', text: 'Defeat the Biome 1 boss (Snorlax)', test: (s) => !!s.bossesDefeated[1] },
  { starter: 'cyndaquil', text: 'Defeat the Biome 2 boss',            test: (s) => !!s.bossesDefeated[2] },
  { starter: 'totodile',  text: 'Win a full run',                     test: (s) => s.runsWon >= 1 },
  { starter: 'treecko',   text: 'Win a run without visiting a rest site', test: (s) => s.noRestWin },
  { starter: 'torchic',   text: 'Defeat a boss without taking any damage', test: (s) => s.noDamageBoss },
  { starter: 'mudkip',    text: 'Win a run with each Kanto starter',
    test: (s) => ['charmander', 'bulbasaur', 'squirtle'].every(id => (s.winsBy[id] || 0) >= 1) },
];
```

## To restore this later
1. Paste the 6 objects above back into the `STARTERS` array in `js/data/starters.js`.
2. Paste the achievement list back into `js/data/achievements.js`.
3. Nothing else needs to change — sprites and shared card/evolution-card data never left.
