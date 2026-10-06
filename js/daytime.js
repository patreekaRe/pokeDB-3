/* ============================================================
   daytime.js  -  the time of day, from the player's own clock.

   Every outdoor scene (the biomes, ? events, the menus' type scenes, the
   title's sky, the rooms' windows) is lit for one of four times. Scenery
   and light are separate: a scene's shapes come from its art, and the time
   only picks its colours (hand-painted skies, graded everything else) and
   switches the sun, moon, stars and lanterns.

   ?time=dawn|day|dusk|night in the URL pins it for playtesting.
   ============================================================ */

export const TIMES = ['dawn', 'day', 'dusk', 'night'];

const pinned = (() => {
  const t = new URLSearchParams(location.search).get('time');
  return TIMES.includes(t) ? t : null;
})();

// the Settings app's Day & night: one time kept whatever the clock says (null follows the clock)
let chosen = null;
export function setClock(t) { chosen = TIMES.includes(t) ? t : null; }

/** 5-7 dawn, 7-17 day, 17-20 dusk, 20-5 night, by the device's local time. */
export function timeOfDay(now = new Date()) {
  if (pinned) return pinned;
  if (chosen) return chosen;
  const h = now.getHours() + now.getMinutes() / 60;
  return h >= 5 && h < 7 ? 'dawn' : h >= 7 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'dusk' : 'night';
}

/* Colour grades, [multiply, +r, +g, +b], one for the sky and one for the land. A scene without a hand-painted look for
   the time (a prop, a menu's rocks, a room's window) is graded with these, so every scene shares one light. */
export const GRADES = {
  dawn: { sky: [0.92, 26, 4, 14], land: [0.82, 16, 2, 10] },
  day: null,
  dusk: { sky: [0.8, 34, 4, -4], land: [0.7, 22, 2, 0] },
  night: { sky: [0.3, 2, 8, 34], land: [0.42, 0, 6, 28] },
  elite: { sky: [0.9, 14, 0, 4], land: [0.88, 10, 0, 2] },
  boss: { sky: [0.78, 18, 0, 10], land: [0.8, 12, 0, 8] },
};

/** One '#rrggbb' through a grade. */
export function gradeHex(hex, [k, r, g, b]) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v, add) => Math.max(0, Math.min(255, Math.round(v * k + add))).toString(16).padStart(2, '0');
  return `#${f(n >> 16, r)}${f((n >> 8) & 255, g)}${f(n & 255, b)}`;
}
