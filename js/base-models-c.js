/* base-models-c.js  -  Pokémon Center, Gym and Beach pieces, modelled from parts like the arcade cabinets (the user's ask, 2026-10-12).
   js/base-models-f.js's head says how a batch works. */

export const SHAPES = {
  // boxes, the painting on the front only (js/base-models-kit.js)
  'potionshelf ballshelf berryshelf medicineshelf trophyshelf': { make: 'frontbox', d: 0.42 },
  'register': { make: 'frontbox', d: 0.5, top: 0.32 },
  'tmcase': { make: 'frontbox', d: 0.5 },
  'healpod': { make: 'frontbox', d: 0.55 },
  'cooler': { make: 'frontbox', d: 0.5, top: 0.15 },
};

export const MAKES = {
};
