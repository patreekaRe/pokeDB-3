/* records.js  -  the Secret Base's records (the user's idea, 2026-10-25): songs bought from a gateway town's trader once
   its Waystone is mended (js/town-shop.js's Records tab), played on a jukebox, record player or gramophone at home
   (js/jukebox.js). The pick is the base's `song`, so it rides to your Trainers page and a friend visiting hears it.
   A record is one line: its `track` is a js/audio.js TRACKS key with loop points, its `town` a TOWNS id (who sells it).
   `ink` colours the record's label. Playtest only till RECORDS_LIVE: `?records` opens it, `?records=all` lends every
   record for the page load. */

export const RECORDS_LIVE = false;

const flag = () => (typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('records'));
export const recordsOpen = () => RECORDS_LIVE || flag() !== null;
/** `?records=all`: every record to hand, never saved as bought. */
export const lendRecords = () => flag() === 'all';

export const RECORDS = [
  { id: 'lantern', town: 'shrine', track: 'town-lantern', name: 'Lantern Village', price: 600, ink: '#d8603a' },
  { id: 'shrine', town: 'shrine', track: 'map1', name: 'Overgrown Shrine', price: 450, ink: '#5a8a3a' },
  { id: 'shrinehall', town: 'shrine', track: 'shrine-room', name: 'Shrine Hall', price: 450, ink: '#a03a4a' },
  { id: 'cinder', town: 'wastes', track: 'town-cinder', name: 'Cinder Springs', price: 600, ink: '#c8462a' },
  { id: 'wastes', town: 'wastes', track: 'map2', name: 'Ember Wastes', price: 450, ink: '#7a3a22' },
  { id: 'hotspring', town: 'wastes', track: 'event-outdoor', name: 'Hot Spring', price: 450, ink: '#3a8aa0' },
  { id: 'driftwood', town: 'ruins', track: 'town-driftwood', name: 'Driftwood Landing', price: 600, ink: '#2a7ab0' },
  { id: 'ruins', town: 'ruins', track: 'ruins', name: 'Sunken Ruins', price: 450, ink: '#3a6a6a' },
  { id: 'treasure', town: 'ruins', track: 'treasure', name: 'Treasure Room', price: 450, ink: '#c89a20' },
  { id: 'highbough', town: 'thornwood', track: 'seal', name: 'Highbough', price: 600, ink: '#6a4aa0' },
  { id: 'thornwood', town: 'thornwood', track: 'thornwood', name: 'Thornwood Jungle', price: 450, ink: '#2a6a3a' },
  { id: 'sunwell', town: 'savanna', track: 'town-sunwell', name: 'Sunwell Bazaar', price: 600, ink: '#e0a020' },
  { id: 'savanna', town: 'savanna', track: 'savanna', name: 'Sunscorch Savanna', price: 450, ink: '#b8742a' },
  { id: 'mart', town: 'savanna', track: 'mart', name: 'Poké Mart', price: 450, ink: '#3a6ac8' },
];
// no prototype, so a friend's page naming `song: '__proto__'` finds nothing
export const RECORDS_BY_ID = Object.assign(Object.create(null), Object.fromEntries(RECORDS.map(r => [r.id, r])));
export const recordsOf = (town) => RECORDS.filter(r => r.town === town);

/** The furniture kinds (a piece's `fam`) that play records. */
export const PLAYERS = new Set(['jukebox', 'dnrjukebox', 'recordplayer', 'gramophone', 'antqgramo']);

/** The records you hold: bought (`save.records`), or every one under `?records=all`. */
export const ownedRecords = (save) => (lendRecords() ? RECORDS.map(r => r.id) : (Array.isArray(save.records) ? save.records : []).filter(id => RECORDS_BY_ID[id]));
