/*
 * Battle transitions, Gen 3/4-style: every fight flashes white twice, then wipes to black its own way
 * (wild: bars slide in from the sides; elite: a closing iris; boss: the screen shatters), and the
 * battle theme starts with the flash. Bosses keep their grey map silhouettes until the walk ends;
 * the arena prelude and Pokémon reveal happen after the wipe. Once the battle is set up under the black, it opens back up onto it
 * the same way. Nothing here saves: a refresh mid-way resumes on the map before the room.
 */
import { el, sleep } from './ui.js';
import { playMusic, preloadCries, preloadMusic } from './audio.js';

const FLASH_MS = 400;
const WIPE_MS = { fight: 450, elite: 550, boss: 620 };
const TRACK = { fight: 'wild', elite: 'elite', boss: 'boss' };
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function preloadBoss(spriteId) {
  preloadCries(spriteId);
  preloadMusic('boss');
}

/** Resolves once the screen is black, with a function that fades it back in; no motion under reduced motion. */
export async function battleWipe(kind) {
  if (still()) return () => {};
  playMusic(TRACK[kind] ?? 'wild', { restart: true, cut: true });
  const wipe = el('div', `battle-wipe wipe-${kind}`);
  (kind === 'boss' ? shatter : kind === 'elite' ? iris : bars)(wipe);
  document.body.append(wipe);
  await sleep(FLASH_MS + (WIPE_MS[kind] ?? WIPE_MS.fight));
  return async () => {
    wipe.classList.add('out');
    await sleep(500);   // the longest opening (the boss's tiles) takes ~470 ms
    wipe.remove();
  };
}

function bars(wipe) {
  const rows = 8;
  for (let r = 0; r < rows; r++) {
    const bar = el('i');
    bar.style.setProperty('--from', r % 2 ? 1 : -1);
    bar.style.setProperty('--delay', `${r * 30}ms`);
    wipe.append(bar);
  }
}

function iris(wipe) {
  wipe.append(el('i'));
}

// tiles snap in from the middle outwards, like glass breaking from the centre
function shatter(wipe) {
  const cols = 8, rows = Math.max(4, Math.round(cols * innerHeight / innerWidth));
  wipe.style.setProperty('--cols', cols);
  wipe.style.setProperty('--rows', rows);
  const reach = Math.hypot((cols - 1) / 2, (rows - 1) / 2);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = el('i');
      const d = Math.hypot(c - (cols - 1) / 2, r - (rows - 1) / 2) / reach;
      tile.style.setProperty('--delay', `${Math.round(d * 380 + Math.random() * 60)}ms`);
      tile.style.setProperty('--spin', Math.random() < 0.5 ? -1 : 1);
      wipe.append(tile);
    }
  }
}
