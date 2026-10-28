/* The trainer you walk as (2026-10-28, the user's ask: "choose a trainer so our buddy can follow us"): Gen 4 walking
   sheets from Vanilla Sunshine's OW pack (credited in About), in assets/overworld/. The four heroes are free and offered
   in the new-player setup; the rest are bought at the Trainer Tailor in the Poké Mall (2026-10-28), all at one price (LOOK_PRICE; the user's call, 2026-10-28).
   No names show (the user's call: you're you, not Ethan): `name` is for screen readers and the bubbles, `line` what Kecleon
   says of it at the Trainer Tailor (never its name). `save.look` is the one worn (null:
   your buddy walks alone, as before), `save.looks` those bought. */

export const LOOKS = [
  { id: 'ethan', name: 'Ethan', free: true, line: 'A cap on backwards and a bag over one shoulder. Ready to set off from home!' },
  { id: 'lyra', name: 'Lyra', free: true, line: 'Big white hat, red ribbon, comfy overalls. Cute and ready for anything!' },
  { id: 'lucas', name: 'Lucas', free: true, line: 'A red beret and a warm scarf. Made for a long walk through the snow!' },
  { id: 'dawn', name: 'Dawn', free: true, line: 'A white beanie, pink boots and a scarf. Stylish on any route!' },
  { id: 'bug-catcher', name: 'Bug Catcher', line: 'Straw hat, net at the ready. The forest\'s best-dressed!' },
  { id: 'cowgirl', name: 'Cowgirl', line: 'Fringe, boots and a wide-brimmed hat. Ride out at sunrise!' },
  { id: 'hiker', name: 'Hiker', line: 'Sturdy boots and a huge pack. Made for mountain trails!' },
  { id: 'black-belt', name: 'Black Belt', line: 'A white gi, belt tied tight. Train hard, look sharp!' },
  { id: 'kimono-girl', name: 'Kimono Girl', line: 'Silk and a sash, every fold just so. Graceful as a dance!' },
  { id: 'ranger-m', name: 'Ranger', line: 'Field gear with a styler on the wrist. Protect the wild!' },
  { id: 'ranger-f', name: 'Ranger', line: 'Field gear with a styler on the wrist. Ready for any rescue!' },
  { id: 'gentleman', name: 'Gentleman', line: 'A tailored suit and a fine moustache. Very proper, very rich!' },
  { id: 'beauty', name: 'Beauty', line: 'A gown that turns heads in every town. Simply stunning!' },
  { id: 'rocket-grunt-m', name: 'Rocket Grunt', line: 'All black, a big red R. Shh, I won\'t tell anyone!' },
  { id: 'rocket-grunt-f', name: 'Rocket Grunt', line: 'All black, a big red R, and boots to match. Very sneaky!' },
  { id: 'youngster', name: 'Youngster', line: 'Shorts all year round. The comfiest look in the shop!' },
  { id: 'lass', name: 'Lass', line: 'A neat little skirt and a bow. Classic and cheerful!' },
  { id: 'picnicker', name: 'Picnicker', line: 'A sun hat and a basket\'s worth of good mood. Off to the meadow!' },
  { id: 'schoolkid', name: 'School Kid', line: 'A smart uniform and a satchel of notes. Top of the class!' },
  { id: 'poke-fan', name: 'Poké Fan', line: 'A Pokémon-eared hood on a big fluffy coat. Love shows!' },
  { id: 'waitress', name: 'Waitress', line: 'An apron with a frilly trim. Table for two, buddy?' },
  { id: 'cameraman', name: 'Cameraman', line: 'A vest full of pockets and a camera on the shoulder. Lights, action!' },
  { id: 'sailor', name: 'Sailor', line: 'Stripes, a cap and sea legs. Anchors aweigh!' },
  { id: 'worker', name: 'Worker', line: 'A hard hat and work boots. Built to last!' },
  { id: 'ruin-maniac', name: 'Ruin Maniac', line: 'A miner\'s lamp and a dusty coat. Ancient secrets await!' },
  { id: 'firebreather', name: 'Firebreather', line: 'Burn-proof and bold. Don\'t stand too close!' },
  { id: 'gambler', name: 'Gambler', line: 'A loud jacket and a lucky grin. Feeling lucky today?' },
  { id: 'ninja-boy', name: 'Ninja Boy', line: 'Dark wraps, soft feet. You\'ll hardly see yourself in the mirror!' },
  { id: 'scientist', name: 'Scientist', line: 'A lab coat with a pocket protector. Very clever, very clean!' },
  { id: 'bird-keeper', name: 'Bird Keeper', line: 'A light jacket and a feather or two. Made for open skies!' },
  { id: 'dragon-tamer', name: 'Dragon Tamer', line: 'A cape and fierce boots. Dragons respect a sharp look!' },
  { id: 'veteran', name: 'Veteran', line: 'A long coat that\'s seen a thousand battles. Pure confidence!' },
  { id: 'captain', name: 'Captain', line: 'A crisp white coat with gold braid. Every ship\'s proudest!' },
];
export const LOOK_PRICE = 500;
export const LOOKS_BY_ID = Object.fromEntries(LOOKS.map(l => [l.id, l]));
export const HEROES = LOOKS.filter(l => l.free);

export const lookSheet = (id) => `assets/overworld/${id}.png`;
export const ownsLook = (save, id) => !!LOOKS_BY_ID[id]?.free || (save.looks || []).includes(id);
const lent = () => (typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('look'));
let trying = null;
/** A look tried on at the Trainer Tailor (js/mall-tailor.js), worn for as long as its window is open, never saved; null
    takes it off. Every place's trainer follows it as it follows the worn look (js/follow.js). */
export const tryLook = (id) => { trying = LOOKS_BY_ID[id] ? id : null; };
/** The look worn, or null: none picked, or one no longer listed. `?look=<id>` lends one for the page load. */
export const wornLook = (save) => LOOKS_BY_ID[trying] ?? LOOKS_BY_ID[lent()] ?? (save.look && ownsLook(save, save.look) ? LOOKS_BY_ID[save.look] : null);
