/* records.js  -  the Secret Base's records (the user's idea, 2026-10-25): songs bought from a gateway town's trader once
   its Waystone is mended (js/town-shop.js's Records tab), played on a jukebox, record player or gramophone at home
   (js/jukebox.js). The pick is the base's `song`, so it rides to your Trainers page and a friend visiting hears it.
   Each town sells its own songs plus the user's Gen 1-4 town themes that suit it (docs/reference/hub-base-mall.md).
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
  // the user's town themes from Gens 1-4 (2026-10-25), each sold by the town it suits
  { id: 'ecruteak-gsc', town: 'shrine', track: 'rec-ecruteak-gsc', name: 'Ecruteak City (G/S/C)', price: 500, ink: '#b8402a' },
  { id: 'violet-gsc', town: 'shrine', track: 'rec-violet-gsc', name: 'Violet City (G/S/C)', price: 500, ink: '#7a4ab0' },
  { id: 'lavender-frlg', town: 'shrine', track: 'rec-lavender-frlg', name: 'Lavender Town (FR/LG)', price: 500, ink: '#9a7ac8' },
  { id: 'sootopolis-rse', town: 'shrine', track: 'rec-sootopolis-rse', name: 'Sootopolis City (R/S/E)', price: 500, ink: '#2a8a9a' },
  { id: 'hearthome-dp', town: 'shrine', track: 'rec-hearthome-dp', name: 'Hearthome City (D/P)', price: 500, ink: '#e06a8a' },
  { id: 'newbark-gsc', town: 'shrine', track: 'rec-newbark-gsc', name: 'New Bark Town (G/S/C)', price: 500, ink: '#6aa04a' },
  { id: 'cherrygrove-gsc', town: 'shrine', track: 'rec-cherrygrove-gsc', name: 'Cherrygrove City (G/S/C)', price: 500, ink: '#d8507a' },
  { id: 'fuchsia-gsc', town: 'shrine', track: 'rec-fuchsia-gsc', name: 'Fuchsia City (G/S/C)', price: 500, ink: '#c84aa0' },
  { id: 'pewter-rb', town: 'wastes', track: 'rec-pewter-rb', name: 'Pewter City (R/B)', price: 500, ink: '#8a7a6a' },
  { id: 'cinnabar-rb', town: 'wastes', track: 'rec-cinnabar-rb', name: 'Cinnabar Island (R/B)', price: 500, ink: '#d83a2a' },
  { id: 'cinnabar-frlg', town: 'wastes', track: 'rec-cinnabar-frlg', name: 'Cinnabar Island (FR/LG)', price: 500, ink: '#e8682a' },
  { id: 'fallarbor-rse', town: 'wastes', track: 'rec-fallarbor-rse', name: 'Fallarbor Town (R/S/E)', price: 500, ink: '#9a9a8a' },
  { id: 'rustboro-rse', town: 'wastes', track: 'rec-rustboro-rse', name: 'Rustboro City (R/S/E)', price: 500, ink: '#a0582a' },
  { id: 'oreburgh-dp', town: 'wastes', track: 'rec-oreburgh-dp', name: 'Oreburgh City (D/P)', price: 500, ink: '#5a4a3a' },
  { id: 'veilstone-dp', town: 'wastes', track: 'rec-veilstone-dp', name: 'Veilstone City (D/P)', price: 500, ink: '#7a6a8a' },
  { id: 'snowpoint-dp', town: 'wastes', track: 'rec-snowpoint-dp', name: 'Snowpoint City (D/P)', price: 500, ink: '#8ac8e8' },
  { id: 'cerulean-rb', town: 'ruins', track: 'rec-cerulean-rb', name: 'Cerulean City (R/B)', price: 500, ink: '#3a7ad8' },
  { id: 'vermilion-rb', town: 'ruins', track: 'rec-vermilion-rb', name: 'Vermilion City (R/B)', price: 500, ink: '#e0603a' },
  { id: 'cerulean-frlg', town: 'ruins', track: 'rec-cerulean-frlg', name: 'Cerulean City (FR/LG)', price: 500, ink: '#4a9ae8' },
  { id: 'vermilion-frlg', town: 'ruins', track: 'rec-vermilion-frlg', name: 'Vermilion City (FR/LG)', price: 500, ink: '#e8803a' },
  { id: 'vermilion-gsc', town: 'ruins', track: 'rec-vermilion-gsc', name: 'Vermilion City (G/S/C)', price: 500, ink: '#c8502a' },
  { id: 'sevii-frlg', town: 'ruins', track: 'rec-sevii-frlg', name: 'Sevii Islands (FR/LG)', price: 500, ink: '#2aa0a0' },
  { id: 'dewford-rse', town: 'ruins', track: 'rec-dewford-rse', name: 'Dewford Town (R/S/E)', price: 500, ink: '#3ab0c8' },
  { id: 'slateport-rse', town: 'ruins', track: 'rec-slateport-rse', name: 'Slateport City (R/S/E)', price: 500, ink: '#2a6ab0' },
  { id: 'lilycove-rse', town: 'ruins', track: 'rec-lilycove-rse', name: 'Lilycove City (R/S/E)', price: 500, ink: '#5a8ae0' },
  { id: 'sunnyshore-dp', town: 'ruins', track: 'rec-sunnyshore-dp', name: 'Sunnyshore City (D/P)', price: 500, ink: '#e8c03a' },
  { id: 'viridian-frlg', town: 'thornwood', track: 'rec-viridian-frlg', name: 'Viridian City (FR/LG)', price: 500, ink: '#3a9a4a' },
  { id: 'fortree-rse', town: 'thornwood', track: 'rec-fortree-rse', name: 'Fortree City (R/S/E)', price: 500, ink: '#7a5a2a' },
  { id: 'verdanturf-rse', town: 'thornwood', track: 'rec-verdanturf-rse', name: 'Verdanturf Town (R/S/E)', price: 500, ink: '#5ab05a' },
  { id: 'azalea-gsc', town: 'thornwood', track: 'rec-azalea-gsc', name: 'Azalea Town (G/S/C)', price: 500, ink: '#d8a0c8' },
  { id: 'oldale-rse', town: 'thornwood', track: 'rec-oldale-rse', name: 'Oldale Town (R/S/E)', price: 500, ink: '#8ac04a' },
  { id: 'petalburg-rse', town: 'thornwood', track: 'rec-petalburg-rse', name: 'Petalburg City (R/S/E)', price: 500, ink: '#e89ab0' },
  { id: 'pallet-rb', town: 'thornwood', track: 'rec-pallet-rb', name: 'Pallet Town (R/B)', price: 500, ink: '#d8d0c0' },
  { id: 'pallet-gsc', town: 'thornwood', track: 'rec-pallet-gsc', name: 'Pallet Town (G/S/C)', price: 500, ink: '#c8b890' },
  { id: 'pallet-frlg', town: 'thornwood', track: 'rec-pallet-frlg', name: 'Pallet Town (FR/LG)', price: 500, ink: '#e8e0c8' },
  { id: 'sandgem-dp', town: 'thornwood', track: 'rec-sandgem-dp', name: 'Sandgem Town (D/P)', price: 500, ink: '#d8b878' },
  { id: 'celadon-rb', town: 'savanna', track: 'rec-celadon-rb', name: 'Celadon City (R/B)', price: 500, ink: '#4aa05a' },
  { id: 'celadon-frlg', town: 'savanna', track: 'rec-celadon-frlg', name: 'Celadon City (FR/LG)', price: 500, ink: '#6ac07a' },
  { id: 'goldenrod-gsc', town: 'savanna', track: 'rec-goldenrod-gsc', name: 'Goldenrod City (G/S/C)', price: 500, ink: '#e8b820' },
  { id: 'saffron-gsc', town: 'savanna', track: 'rec-saffron-gsc', name: 'Saffron City (G/S/C)', price: 500, ink: '#e8a03a' },
  { id: 'jubilife-dp', town: 'savanna', track: 'rec-jubilife-dp', name: 'Jubilife City (D/P)', price: 500, ink: '#4a8ad8' },
];
// no prototype, so a friend's page naming `song: '__proto__'` finds nothing
export const RECORDS_BY_ID = Object.assign(Object.create(null), Object.fromEntries(RECORDS.map(r => [r.id, r])));
export const recordsOf = (town) => RECORDS.filter(r => r.town === town);

/** The furniture kinds (a piece's `fam`) that play records. */
export const PLAYERS = new Set(['jukebox', 'dnrjukebox', 'recordplayer', 'gramophone', 'antqgramo']);

/** The records you hold: bought (`save.records`), or every one under `?records=all`. */
export const ownedRecords = (save) => (lendRecords() ? RECORDS.map(r => r.id) : (Array.isArray(save.records) ? save.records : []).filter(id => RECORDS_BY_ID[id]));
