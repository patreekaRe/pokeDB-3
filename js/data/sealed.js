/* ============================================================
   sealed.js  -  Mewtwo's Sealed Weakness, its pentagram and the Depths camp (docs/roadmap.md's Towns step 5, the
   user's design, 2026-10-14). Freed from the gate, Mewtwo is still too weak for what's below: in the Crystal Depths its
   attacks deal less (SEALED / sealedMult() in difficulty.js), and each town's Waystone mended, its shard of Depths
   crystal back in place, sends a fifth of its strength back down to it. The five slots of its pentagram are the five
   towns of the Waystone ring (RING), in their colours. Once the gate is broken every won run falls into a crystal
   miners' camp in the Depths, Mewtwo standing by the way in; only Mewtwo goes past it. All of it waits on the towns
   (townsOpen()), as the shards do. Pure (tests/sealed.test.mjs).
   ============================================================ */

import { RING, townState, mended, townsOpen } from './towns.js';
import { SEALED, sealedMult } from './difficulty.js';

/** `?shards=N` plays a page load as if the first N towns of the ring were mended (with `?towns`), every one new to
    Mewtwo each time: its weakness, the pentagram and the camp. */
const shardFlag = () => (typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('shards'));

/** The towns whose shard is back in their Waystone, in the ring's order. */
export const shardsBack = (save) => {
  const flag = shardFlag();
  if (flag !== null) return RING.slice(0, Math.max(0, Math.min(RING.length, Number(flag) || 0))).map(t => t.id);
  return RING.filter(t => mended(townState(save, t.id))).map(t => t.id);
};

/** Whether Mewtwo's weakness, its pentagram and the camp are on: they follow the towns, where the shards come from. */
export const sealedOn = () => townsOpen();

/** The Waystones mended for Mewtwo's weakness in a run's Depths, or null while it's off. */
export const sealedShards = (save) => (sealedOn() ? shardsBack(save).length : null);

/** How much of Mewtwo's strength is back, in percent. */
export const strengthBack = (n) => Math.round(sealedMult(n) * 100);

/** The shards back that Mewtwo hasn't been shown yet (save.pentagram: the slots it has seen light), for the pentagram's
    new slots lighting up and the camp's "something new" that keeps a won run's landing from being one tap. */
export const newShards = (save) => (shardFlag() !== null ? shardsBack(save) : shardsBack(save).filter(id => !(save.pentagram || []).includes(id)));

/** Whether the camp is open: the gate broken (`hp`, its HP: js/gate.js's gateHp()), the towns on. */
export const campOpen = (hp) => sealedOn() && hp <= 0;

/* What Mewtwo says in the camp, by how many shards are back (0-5): why it needs them, what Eternatus is, how much of
   its strength has come back. The first time it says `MEET` first. A shard newly back gets its `THANKS` line. */
export const MEET = [
  'You fell a long way. The crystals caught you, as they caught me once.',
  'This is where the miners camped, before the gate was shut on all of us. I keep watch at the way in now.',
];
export const CAMP_LINES = [
  [
    'Below us sleeps Eternatus. Its energy is what sealed me, and what holds me still.',
    'When the gate was shut, the crystal cracked. Five shards flew up and out, to the towns on your roads.',
    'Each one carries a piece of what I was. Put them back in their Waystones and their light will find me here.',
    'I can go down as I am. But half of me would stay behind, and the Depths do not forgive half.',
  ],
  [
    'One stone sings again. I can feel it from here, faint, like a fire in another room.',
    'Eternatus feeds on the dark between the stones. Every one you light, it has a little less.',
    'Four more. I am not asking you to hurry. I have waited longer than you have lived.',
  ],
  [
    'Two stones. My hands have stopped shaking.',
    'Eternatus was here before the miners, before the towns. It came down from the sky and burrowed in to sleep.',
    'They built the gate to keep it asleep. They did not know they had shut me in with it.',
  ],
  [
    'Three. More than half of me is back. I remember what it is to strike without holding back.',
    'When Eternatus wakes fully, it swells. The miners called that the Darkest Day.',
    'Two stones still dark. Their towns are waiting on someone. On you.',
  ],
  [
    'Four. One shard left, and I can feel exactly where it is.',
    'The last stone is the hardest to hear. Its town must be the furthest from here, or the loudest.',
    'When it lights, I will be what I was before the gate. Then we finish this.',
  ],
  [
    'All five. Every stone is lit, and every piece of me is back.',
    'Eternatus will feel it too. It will not sleep through this.',
    'Whenever you are ready, I am. The way in is right behind me.',
  ],
];
export const THANKS = 'Another stone is lit. I felt its shard settle into place. {strength}% of my strength is back.';

/** Its lines in the camp: the first meeting's, a new shard's thanks, then where the shards stand (`short`: only the first
    of those, as a won run lands with a shard to show). */
export function campLines(save, { first = false, fresh = 0, short = false } = {}) {
  const n = shardsBack(save).length, now = CAMP_LINES[Math.min(n, CAMP_LINES.length - 1)];
  const lines = first ? [...MEET] : [];
  if (fresh) lines.push(THANKS.replace('{strength}', strengthBack(n)));
  return [...lines, ...(short && !first ? now.slice(0, 1) : now)];
}

/** The pentagram's line under the star. */
export const pentagramLine = (n) => (n >= SEALED.shards ? 'Every Waystone is lit. Mewtwo is at full strength.'
  : `${n} of ${SEALED.shards} Waystones lit. In the Crystal Depths, Mewtwo's attacks deal ${strengthBack(n)}% damage.`);
