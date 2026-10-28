/* The trainer you walk as (2026-10-28, the user's ask: "choose a trainer so our buddy can follow us"): Gen 4 walking
   sheets from Vanilla Sunshine's OW pack (credited in About), in assets/overworld/. The four heroes are free and offered
   in the new-player setup; the rest are bought on the Trainer Card, all at one price (LOOK_PRICE; the user's call, 2026-10-28).
   No names show (the user's call: you're you, not Ethan): `name` is for screen readers and the bubbles. `save.look` is the one worn (null:
   your buddy walks alone, as before), `save.looks` those bought. */

export const LOOKS = [
  { id: 'ethan', name: 'Ethan', free: true },
  { id: 'lyra', name: 'Lyra', free: true },
  { id: 'lucas', name: 'Lucas', free: true },
  { id: 'dawn', name: 'Dawn', free: true },
  { id: 'bug-catcher', name: 'Bug Catcher' },
  { id: 'cowgirl', name: 'Cowgirl' },
  { id: 'hiker', name: 'Hiker' },
  { id: 'black-belt', name: 'Black Belt' },
  { id: 'kimono-girl', name: 'Kimono Girl' },
  { id: 'ranger-m', name: 'Ranger' },
  { id: 'ranger-f', name: 'Ranger' },
  { id: 'gentleman', name: 'Gentleman' },
  { id: 'beauty', name: 'Beauty' },
  { id: 'rocket-grunt-m', name: 'Rocket Grunt' },
  { id: 'rocket-grunt-f', name: 'Rocket Grunt' },
  { id: 'youngster', name: 'Youngster' },
  { id: 'lass', name: 'Lass' },
  { id: 'picnicker', name: 'Picnicker' },
  { id: 'schoolkid', name: 'School Kid' },
  { id: 'poke-fan', name: 'Poké Fan' },
  { id: 'waitress', name: 'Waitress' },
  { id: 'cameraman', name: 'Cameraman' },
  { id: 'sailor', name: 'Sailor' },
  { id: 'worker', name: 'Worker' },
  { id: 'ruin-maniac', name: 'Ruin Maniac' },
  { id: 'firebreather', name: 'Firebreather' },
  { id: 'gambler', name: 'Gambler' },
  { id: 'ninja-boy', name: 'Ninja Boy' },
  { id: 'scientist', name: 'Scientist' },
  { id: 'bird-keeper', name: 'Bird Keeper' },
  { id: 'dragon-tamer', name: 'Dragon Tamer' },
  { id: 'veteran', name: 'Veteran' },
  { id: 'captain', name: 'Captain' },
];
export const LOOK_PRICE = 500;
export const LOOKS_BY_ID = Object.fromEntries(LOOKS.map(l => [l.id, l]));
export const HEROES = LOOKS.filter(l => l.free);

export const lookSheet = (id) => `assets/overworld/${id}.png`;
export const ownsLook = (save, id) => !!LOOKS_BY_ID[id]?.free || (save.looks || []).includes(id);
const lent = () => (typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('look'));
/** The look worn, or null: none picked, or one no longer listed. `?look=<id>` lends one for the page load. */
export const wornLook = (save) => LOOKS_BY_ID[lent()] ?? (save.look && ownsLook(save, save.look) ? LOOKS_BY_ID[save.look] : null);
