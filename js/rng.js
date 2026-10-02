/* ============================================================
   rng.js  -  every gameplay roll (maps, enemies, draws, rewards, Mart
   stock, events) goes through random() here, so a Safari Zone daily run
   can play the same for everyone on a UTC date.

   Unseeded (the main game) it is Math.random. A Safari run calls
   useStream() with its seed and a key per biome and per room: each room
   gets its own stream, so the same room plays the same whatever was
   picked before it, and a refresh that replays a room rolls it again
   exactly. Cosmetic rolls (sparkles, blinks, the title) stay on
   Math.random and never touch a stream.
   ============================================================ */

/** A 32-bit hash of a string (FNV-1a, then a murmur finaliser so close strings land far apart). */
export function hashString(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

/** A seeded generator (mulberry32): a function returning floats in [0, 1), like Math.random. */
export function makeRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A generator for one named stream of a seed ('biome:0', 'room:1:n12'...). */
export const streamOf = (seed, key) => makeRng(hashString(`${seed}|${key}`));

let stream = null;   // null: Math.random (the main game)

/** The gameplay roll: [0, 1). */
export const random = () => (stream ? stream() : Math.random());

/** Roll on `key`'s stream of `seed` from here on; no seed goes back to Math.random. */
export function useStream(seed, key) {
  stream = seed == null ? null : streamOf(seed, key);
}

/** An index into a list of `n`, with `rand` (default: the gameplay roll). */
export const randIndex = (n, rand = random) => Math.floor(rand() * n);

/** One item of a list. */
export const pickOne = (list, rand = random) => list[randIndex(list.length, rand)];

/** A shuffled copy (Fisher-Yates: sort() with a random comparator isn't uniform, and differs between browsers). */
export function shuffled(list, rand = random) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = randIndex(i + 1, rand);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
