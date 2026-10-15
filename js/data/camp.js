/* camp.js  -  the Depths camp (docs/roadmap.md's step 5, the user's design, 2026-10-14): once the Sealed Gate is broken, a
   won run's fall (or the Sealed Gate's second button in the Clearing) drops you to a camp in the Crystal Depths, walked
   like a town's house (homeRoom() in js/run.js, its room HOMES.depths.camp in js/event-3d.js). Mewtwo stands by the
   way in to the Depths proper; talking to it brings up the shard pentagram (js/pentagram.js), and what it says follows
   the Waystone Shards placed. A pseudo-town like the Clearing's houses: placeOf('depths') in js/data/towns.js. */

import { SEALED_WEAKNESS, sealedMult } from './difficulty.js';

export const DEPTHS_CAMP = {
  id: 'depths', biome: 'depths', name: 'Crystal Depths', music: 'seal', home: true,
  // `back`: where leaving puts you in the Clearing, in front of the Sealed Gate
  buildings: [{ id: 'camp', name: 'DEPTHS CAMP', home: 'camp', back: 'gate' }],
  homes: {
    camp: { name: 'Depths Camp', mewtwo: true,
      sub: 'A camp in the crystal dark: a fire, a tent, crates from the last who came down. Mewtwo waits by the way in.',
      subSelf: 'A camp in the crystal dark: a fire, a tent, crates from the last who came down. Behind the arch, the Well.',
      cast: {} },
  },
  leaders: {},
};

/** The Sealed Weakness in words: how much of Mewtwo's damage it deals in the Depths with `n` shards placed. */
export const strengthOf = (n) => Math.round(sealedMult(n) * 100);

/** What Mewtwo says in the camp with `n` of the five shards placed: why it needs them, what Eternatus is, how much of its
    strength is back. The pentagram shows under it. */
export function campLines(n) {
  const pct = strengthOf(n), left = SEALED_WEAKNESS.shards - n;
  if (n <= 0) return [
    'This is as far down as the light reaches. Past that arch lies the Energy Well... and Eternatus.',
    'The seal held it for an age. When the gate was shut, the crystal that bound it cracked, and the shards flew far.',
    'Five of them became your Waystones. And with them went my strength.',
    `Down there I fight at ${pct}% of my power. I can still go, but I cannot promise to come back.`,
    'Mend the five Waystones. Each one\'s light finds its way down here, to me.',
  ];
  if (left > 0) return [
    `${n === 1 ? 'One Waystone burns' : `${n} Waystones burn`} again. I feel it: ${pct}% of my strength is back.`,
    'Eternatus feeds on the Well\'s energy. Every stone you mend is energy it no longer has, and I do.',
    `${left === 1 ? 'One more' : `${left} more`}, and the star is whole.`,
  ];
  return [
    'All five. The star is whole, and my strength is mine again.',
    'Eternatus has felt it too. It is waiting for us, at the bottom of the Well.',
    'When you are ready, I go down at full power.',
  ];
}

/** Mewtwo before one of its runs: the weakness it carries into the Depths, said over the pentagram. */
export function runLines(n) {
  const pct = strengthOf(n);
  return n >= SEALED_WEAKNESS.shards
    ? ['The five stones burn. In the Depths, I fight at full strength.']
    : [`The seal still weighs on me. In the Crystal Depths, my attacks deal ${pct}% of their damage.`,
      'Each Waystone mended gives 10% back.'];
}

/** A won run's landing with nothing new in the camp: one line from Mewtwo, one tap, then the win. */
export function landLine(n) {
  return n >= SEALED_WEAKNESS.shards ? 'You came down again. The star is whole: I am ready when you are.'
    : `You came down again. ${n} of the five burn, ${strengthOf(n)}% of my strength. Bring me more of their light.`;
}

/** Mewtwo's own run, landing in the camp after its third boss: what it feels of its strength, before it goes on down. */
export function selfLines(n) {
  const pct = strengthOf(n);
  if (n <= 0) return ['The camp. A fire, and the arch to the Well.', 'No Waystone burns yet. Down there, the seal still holds half my power.', 'So be it. I go down as I am.'];
  return n >= SEALED_WEAKNESS.shards
    ? ['The camp. The five stones\' light has reached even here.', 'My strength is whole. Eternatus, I am coming.']
    : ['The camp. The stones\' light reaches even here.', `${n} of the five burn: ${pct}% of my strength is back.`, 'The arch to the Well waits. I go down.'];
}
