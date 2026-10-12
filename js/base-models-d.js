/* base-models-d.js  -  Spooky, Bathroom, Bedroom and Office pieces, modelled from parts like the arcade cabinets (the user's ask, 2026-10-12).
   js/base-models-f.js's head says how a batch works. */

export const SHAPES = {
  // boxes, the painting on the front only (js/base-models-kit.js)
  'squaregrave': { make: 'frontbox', d: 0.22 },
  'witchshelf': { make: 'frontbox', d: 0.4 },
  'organ': { make: 'frontbox', d: 0.6, top: 0.48 },
  'minifridge': { make: 'frontbox', d: 0.55, top: 0.3 },
  'copier serverrack': { make: 'frontbox' },
  'safe': { make: 'frontbox', d: 0.6 },
  'shredder': { make: 'frontbox', d: 0.45, top: 0.1 },
  'cubicle': { make: 'frontbox', d: 0.15 },
};

export const MAKES = {
};
