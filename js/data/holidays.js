/* holidays.js  -  the seasonal furniture sets' windows (2026-10-16, the user's pick from docs/furniture-expansion.md:
   seasonal sets, Animal Crossing's way). A seasonal kind carries `holiday: '<id>'`; the Furniture store deals it only
   while its holiday is on, one stand a floor kept for the holiday's set (dealDay() in js/secret-base.js), and never
   otherwise. Windows are by the UTC day the stock is dealt for, `[month, day]` both ends included; a window may run
   over New Year. The birthday party is no holiday: its kinds carry none and are sold all year. `?holiday=<id>` holds a
   holiday on for the page load. Pure, no DOM. */

export const HOLIDAYS = [
  { id: 'newyear', name: 'New Year', from: [12, 26], to: [1, 10] },
  { id: 'valentine', name: 'Valentine\'s', from: [2, 1], to: [2, 14] },
  { id: 'eggday', name: 'Egg Day', from: [3, 20], to: [4, 20] },
  { id: 'wedding', name: 'Wedding season', from: [6, 1], to: [6, 30] },
  { id: 'summer', name: 'Summer festival', from: [7, 1], to: [8, 31] },
  { id: 'lantern', name: 'Lantern Festival', from: [9, 1], to: [9, 30] },
  { id: 'harvest', name: 'Harvest', from: [11, 1], to: [11, 30] },
  { id: 'holidays', name: 'Winter holidays', from: [12, 1], to: [12, 25] },
];
export const HOLIDAY = Object.fromEntries(HOLIDAYS.map(h => [h.id, h]));

const pinned = () => (typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('holiday'));

/** The holidays on for a day ('YYYY-MM-DD'). */
export function holidaysOn(day) {
  const pin = pinned();
  if (pin && HOLIDAY[pin]) return [pin];
  const [, m, d] = day.split('-').map(Number), at = m * 100 + d;
  return HOLIDAYS.filter(({ from: [fm, fd], to: [tm, td] }) => {
    const a = fm * 100 + fd, b = tm * 100 + td;
    return a <= b ? at >= a && at <= b : at >= a || at <= b;
  }).map(h => h.id);
}
