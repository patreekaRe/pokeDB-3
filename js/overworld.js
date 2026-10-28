import { OVERWORLD } from './data/overworld.js';

/** A Pokémon's overworld walking sheet (js/data/overworld.js, tools/overworld-import.py) for its battle GIF, if it has one
    and ?ow=0 isn't set: a legendary's powered-up GIF keeps its GIF, the aura being drawn into it. */
export function overworldSrc(front) {
  const [, id, shiny] = front.match(/\/([a-z0-9-]+?)(-shiny)?-front\.gif$/) || [];
  if (!OVERWORLD.has(id) || new URLSearchParams(location.search).get('ow') === '0') return null;
  return `assets/overworld/${id}${shiny ?? ''}.png`;
}

/** The sheet's rows, top to bottom. */
export const OW_ROW = { down: 0, left: 1, right: 2, up: 3 };
