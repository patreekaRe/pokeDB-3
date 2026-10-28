/*
 * The credits (v1.0 part D): after a Champion of the Depths' Hall of Fame (js/halloffame.js), the staff roll climbs over
 * the cavern like the games' ending, with the cast's sprites along the way, then THE END. A tap during the roll skips to
 * THE END; a tap there closes it. Under reduced motion the roll doesn't move: it's a page you tap through.
 */
import { el, sleep } from './ui.js';
import { STARTERS_BY_ID, spriteUrl, stageName } from './data/starters.js';
import { ENEMY_DEFS, BIOMES } from './data/enemies.js';
import { PATCHES } from './data/patchnotes.js';
import { sealOn } from './data/towns.js';
import { playSound, playCry } from './audio.js';

const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const SECONDS = 38;   // the roll's length at its own pace

/* How the Well ended (js/well.js's `bind`), set by endRun() before the win scene: 'full' is the true ending, 'part' a
   closed Well that ends on Eternatus's eye opening, 'plain' the ending from before the shards counted. */
let ending = { bind: 'plain', shards: 5 };
export const creditsEnding = (bind, shards) => { ending = { bind, shards }; };

/** The roll: [heading, ...lines], or a row of sprites ({ cast }). */
function sections(entry) {
  const mewtwo = STARTERS_BY_ID[entry.starter];
  return [
    { cast: [spriteUrl(mewtwo, 'front', entry.stage, entry.shiny)], big: true, caption: `${stageName(mewtwo, entry.stage)}, Champion of the Depths` },
    ['Created by', 'Patrick'],
    ['Game design', 'Patrick'],
    ['Playtesting', 'Britt'],
    ['Programming', 'Patrick', 'with Claude Code and opencode'],
    { cast: ['charmander', 'bulbasaur', 'squirtle'].map(id => spriteUrl(STARTERS_BY_ID[id], 'front', 0, false)), caption: 'The first three' },
    ['Pokémon sprites', 'PokeAPI/sprites', 'Gen 5 art, Black & White'],
    ['Eternatus and Eternamax', 'Pokémon Showdown\'s sprites, via PokeAPI'],
    ['Cries', 'PokeAPI'],
    ['Item and relic sprites', 'PokéSprite by msikma'],
    ['Trainer sprites', 'justin8964 (Team Rocket)', 'kyledove on Pokéngine (event NPCs)', 'Jext on Pokéngine (the Move Tutor)'],
    ['Townspeople', 'Gen 4 OW Sprites by Neo-Spriteman, Vanilla Sunshine,', 'PurpleZaffre & Maicerochico, AtomicReactor'],
    ['Music', 'The Pokémon games\' soundtracks', 'uploads credited in About & credits'],
    { cast: BIOMES.map(b => ENEMY_DEFS[b.bosses.at(-1)].image), caption: 'And everyone who stood in the way' },
    ['Inspired by', 'Slay the Spire, by Mega Crit', 'Pokémon Gold & Silver\'s Hall of Fame'],
    ['Pokémon', '© Nintendo, Creatures Inc., GAME FREAK inc.', 'Poké Deckbound is a free fan game,', 'not affiliated with any of them.'],
    ['Special thanks', 'You, for playing to the very bottom'],
  ];
}

function rollOf(entry) {
  const roll = el('div', 'credits-roll');
  roll.append(el('h2', 'credits-logo', 'Poké Deckbound'), el('p', 'credits-version', `v${PATCHES[0].version}`));
  for (const part of sections(entry)) {
    const box = el('section', 'credits-part');
    if (part.cast) {
      const row = el('div', `credits-cast${part.big ? ' big' : ''}`);
      row.append(...part.cast.map(src => {
        const img = el('img', 'pixel');
        img.src = src;
        img.alt = '';
        return img;
      }));
      box.append(row, el('p', 'credits-caption', part.caption));
    } else {
      const [head, ...lines] = part;
      box.append(el('h3', 'credits-head', head), ...lines.map(line => el('p', 'credits-line', line)));
    }
    roll.append(box);
  }
  return roll;
}

const tapped = (layer) => new Promise(resolve => layer.addEventListener('click', (e) => { e.stopPropagation(); resolve(); }, { once: true }));

/** Roll the credits over `scene`; resolves once THE END is tapped away. */
export async function rollCredits(scene, entry) {
  const layer = el('div', 'hof-credits scene-keep');
  const roll = rollOf(entry);
  const end = el('div', 'credits-end');
  const { bind, shards } = ending;
  if (bind === 'full') end.append(el('p', 'credits-true', 'TRUE ENDING'));
  end.append(el('h2', '', bind === 'part' ? 'THE END...?' : 'THE END'), el('p', '', 'Thanks for playing!'), el('p', 'credits-tap', '▼'));
  layer.append(roll, end);
  scene.append(layer);
  await sleep(50);
  layer.classList.add('in');

  if (!still()) {
    roll.style.setProperty('--secs', `${SECONDS}s`);
    roll.classList.add('rolling');
    await new Promise(resolve => {
      const done = () => { layer.removeEventListener('click', skip); resolve(); };
      const skip = (e) => { e.stopPropagation(); roll.removeEventListener('animationend', done); done(); };
      roll.addEventListener('animationend', done, { once: true });
      setTimeout(() => layer.addEventListener('click', skip), 600);   // not the tap that ended the last line
    });
  }
  layer.classList.add('ended');
  await sleep(still() ? 0 : 900);
  await tapped(layer);
  // after the credits: the dark, a crystal's chime, and Mewtwo's last word (the camp's once the shards count, else the gate's)
  const coda = el('div', 'credits-coda');
  const word = bind === 'full'
    ? 'Tell Lantern Village, Cinder Springs, Driftwood Landing, Highbough and Sunwell Bazaar: the Well sleeps for good. I will be at the camp, when you want to fight together again.'
    : `...I will be at the ${sealOn() ? 'camp' : 'gate'}. When you want to fight together again.`;
  coda.append(el('small', '', 'MEWTWO'), el('p', '', word));
  layer.append(coda);
  layer.classList.add('coda');
  await sleep(still() ? 0 : 1100);
  playSound('crystal-2');
  coda.classList.add('in');
  await sleep(still() ? 0 : 700);
  await tapped(layer);
  if (bind === 'part') await stirs(layer, coda, shards);
  layer.classList.add('out');
  await sleep(still() ? 0 : 500);
  layer.remove();
}

/** A Well only closed, not bound: in the dark, Eternatus's eye opens with its slowed cry, and the way to bind it. */
async function stirs(layer, coda, shards) {
  coda.classList.remove('in');
  await sleep(still() ? 0 : 900);
  const eye = el('div', 'credits-eye');
  eye.append(el('div', 'credits-eye-lid'), el('p', '', 'The Well will wake again.'),
    el('small', '', `Mend all five Waystones to bind it for good. ${shards} of 5 mended.`));
  layer.append(eye);
  await sleep(50);
  eye.classList.add('in');
  playSound('gate-hum');
  await Promise.race([playCry('eternatus', { rate: 0.7, echo: true }), sleep(2600)]);
  await tapped(layer);
}
