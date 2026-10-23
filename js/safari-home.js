/* safari-home.js  -  a new Safari player's first FIRST_HOME catches move into the Secret Base's main room by themselves
   (the user's call, 2026-10-23), the first with a window saying every catch can live there, 6 a room, so the base has
   company and its Pokémon tab is found. Saved into `secretBase.mons` even before the base is bought (a `secretBase` of
   only `mons`; loadBase() in js/secret-base.js keeps them when it makes the first room). A third catch never moves in. */
import { getSave, updateSave } from './storage.js';
import { ENEMY_DEFS } from './data/enemies.js';
import { shinyImage } from './data/shinies.js';

export const FIRST_HOME = 2;

/** A Safari catch new to the Safari Pokédex, moved in if it's one of the first FIRST_HOME: null if not, its name if so,
    and the first time `told`, an unlock window's entry (js/run.js's unlockWindow()) saying so. */
export function moveInFirst(id, shiny) {
  const save = getSave(), caught = save.safariDex.caught;
  if (caught.length > FIRST_HOME || save.secretBase?.mons?.includes(id)) return null;
  const before = save.secretBase?.mons ?? caught.filter(x => x !== id), told = !save.safariHomeTold;
  updateSave(d => { d.secretBase = { ...(d.secretBase || {}), mons: [...before, id] }; d.safariHomeTold = true; });
  const def = ENEMY_DEFS[id], name = `${shiny ? 'Shiny ' : ''}${def.name}`;
  if (!told) return { name };
  const owned = save.baseOwned || save.secretBase?.v >= 2;
  return { name, told: { feat: true, kicker: '🏠 A new housemate!', name, sprite: shiny ? shinyImage(id) : def.image, cry: def.spriteId ?? id,
    text: `${name} moved into your Secret Base!`,
    hint: `Safari Pokémon you catch can live in your Secret Base now, 6 in each room, the backyard too: pick them on a room's Pokémon tab, or at the PC's Base Residents.${owned ? '' : ' Make the Ancient Tree in the Clearing your Secret Base to visit them.'}` } };
}

