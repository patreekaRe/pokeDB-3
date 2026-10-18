/* ============================================================
   shinies.js  -  the Safari Zone's wild shinies and their Sparkle.

   Any wild in a Safari run's rooms may come out shiny (rares too).
   It fights exactly as the normal one, so the roll is cosmetic and
   stays off the daily seed (Math.random): the run and its leaderboard
   are the same for everyone. Caught, it's yours: the save's
   `safariShinies` maps its id to its Sparkle, 1-5, a duplicate +1.
   ============================================================ */

export const SHINY_ODDS = 1 / 150;
export const SPARKLE_MAX = 5;

export const shinyImage = (id) => `assets/pokemon/${id}-shiny-front.gif`;

/** Mark the biome's wild rooms that hold a shiny (`odds` 1 is the ?wildshiny playtest). */
export function markShinies(rooms, odds = SHINY_ODDS, roll = Math.random) {
  for (const room of rooms) if (roll() < odds) room.shiny = true;
}

/** Its Sparkle, 0 while its shiny isn't yours. */
export const sparkleOf = (shinies, id) => Math.max(0, Math.min(SPARKLE_MAX, Math.floor(shinies?.[id] || 0)));

/** What catching its shiny does, without doing it: `was` -> `level`; `maxed` when it was already at ★5. */
export function shinyGain(shinies, id) {
  const was = sparkleOf(shinies, id);
  return { was, level: Math.min(SPARKLE_MAX, was + 1), isNew: was === 0, maxed: was === SPARKLE_MAX };
}

/** Catch it: raises its Sparkle in `shinies` (the save's map) and says what changed. */
export function addShiny(shinies, id) {
  const gain = shinyGain(shinies, id);
  shinies[id] = gain.level;
  return gain;
}

/** The catch box's line for it. */
export function shinyLine(name, gain) {
  if (gain.isNew) return `✨ NEW SHINY! Shiny ${name} is yours, at Sparkle ★1.`;
  if (gain.maxed) return `✨ Shiny ${name}'s Sparkle is already ★5, as bright as it gets.`;
  return `✨ Shiny ${name}'s Sparkle went up: ★${gain.was} → ★${gain.level}!`;
}
