/* ============================================================
   season.js  -  the time of year, from the player's own clock.

   The title's Clearing dresses up by the date the way daytime.js
   follows the hour: October is Halloween, December winter. A new
   season is a line in season() and its look in js/hub-season.js.

   ?season=halloween|winter|none in the URL pins it for playtesting.
   ============================================================ */

export const SEASONS = ['halloween', 'winter'];

const pinned = (() => {
  const s = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('season');
  return s === 'none' ? null : SEASONS.includes(s) ? s : undefined;
})();

/** 'halloween' all October, 'winter' all December, else null; by the device's local date. */
export function season(now = new Date()) {
  if (pinned !== undefined) return pinned;
  const m = now.getMonth();
  return m === 9 ? 'halloween' : m === 11 ? 'winter' : null;
}
