/* The trainer you walk as (2026-10-28, the user's ask: "choose a trainer so our buddy can follow us"): Gen 4 walking
   sheets from Vanilla Sunshine's OW pack (credited in About), in assets/overworld/. The four heroes are free and offered
   in the new-player setup; the classes are bought with PokéCoins on the Trainer Card. `save.look` is the one worn (null:
   your buddy walks alone, as before), `save.looks` those bought. */

export const LOOKS = [
  { id: 'ethan', name: 'Ethan', free: true },
  { id: 'lyra', name: 'Lyra', free: true },
  { id: 'lucas', name: 'Lucas', free: true },
  { id: 'dawn', name: 'Dawn', free: true },
  { id: 'bug-catcher', name: 'Bug Catcher', price: 300 },
  { id: 'cowgirl', name: 'Cowgirl', price: 300 },
  { id: 'hiker', name: 'Hiker', price: 300 },
  { id: 'black-belt', name: 'Black Belt', price: 400 },
  { id: 'kimono-girl', name: 'Kimono Girl', price: 400 },
  { id: 'ranger-m', name: 'Ranger', price: 500 },
  { id: 'ranger-f', name: 'Ranger', price: 500 },
  { id: 'gentleman', name: 'Gentleman', price: 600 },
  { id: 'beauty', name: 'Beauty', price: 600 },
  { id: 'rocket-grunt-m', name: 'Rocket Grunt', price: 800 },
  { id: 'rocket-grunt-f', name: 'Rocket Grunt', price: 800 },
];
export const LOOKS_BY_ID = Object.fromEntries(LOOKS.map(l => [l.id, l]));
export const HEROES = LOOKS.filter(l => l.free);

export const lookSheet = (id) => `assets/overworld/${id}.png`;
export const ownsLook = (save, id) => !!LOOKS_BY_ID[id]?.free || (save.looks || []).includes(id);
const lent = () => (typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('look'));
/** The look worn, or null: none picked, or one no longer listed. `?look=<id>` lends one for the page load. */
export const wornLook = (save) => LOOKS_BY_ID[lent()] ?? (save.look && ownsLook(save, save.look) ? LOOKS_BY_ID[save.look] : null);
