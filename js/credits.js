/*
 * The credits (v1.0 part D): after a Champion of the Depths' Hall of Fame (js/halloffame.js), the staff roll climbs over
 * the cavern like the games' ending, with the cast's sprites along the way, then THE END. A tap during the roll skips to
 * THE END; a tap there closes it. Under reduced motion the roll doesn't move: it's a page you tap through.
 */
import { el, sleep } from './ui.js';
import { STARTERS_BY_ID, spriteUrl, stageName } from './data/starters.js';
import { ENEMY_DEFS, BIOMES } from './data/enemies.js';

const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const SECONDS = 38;   // the roll's length at its own pace

/** The roll: [heading, ...lines], or a row of sprites ({ cast }). */
function sections(entry) {
  const mewtwo = STARTERS_BY_ID[entry.starter];
  return [
    { cast: [spriteUrl(mewtwo, 'front', entry.stage, entry.shiny)], big: true, caption: `${stageName(mewtwo, entry.stage)}, Champion of the Depths` },
    ['Created by', 'Patrick'],
    ['Game design', 'Patrick'],
    ['Playtesting', 'Patrick', 'and every run that fainted on the way'],
    ['Programming', 'Patrick', 'with Claude Code and opencode'],
    { cast: ['charmander', 'bulbasaur', 'squirtle'].map(id => spriteUrl(STARTERS_BY_ID[id], 'front', 0, false)), caption: 'The first three' },
    ['Pokémon sprites', 'PokeAPI/sprites', 'Gen 5 art, Black & White'],
    ['Eternatus and Eternamax', 'Pokémon Showdown\'s sprites, via PokeAPI'],
    ['Cries', 'PokeAPI'],
    ['Item and relic sprites', 'PokéSprite by msikma'],
    ['Trainer sprites', 'justin8964 (Team Rocket)', 'kyledove on Pokéngine (event NPCs)', 'Jext on Pokéngine (the Move Tutor)'],
    ['Music', 'The Pokémon games\' soundtracks', 'uploads credited in About & credits'],
    { cast: BIOMES.map(b => ENEMY_DEFS[b.bosses.at(-1)].image), caption: 'And everyone who stood in the way' },
    ['Inspired by', 'Slay the Spire, by Mega Crit', 'Pokémon Gold & Silver\'s Hall of Fame'],
    ['Pokémon', '© Nintendo, Creatures Inc., GAME FREAK inc.', 'PokéDB is a free fan game,', 'not affiliated with any of them.'],
    ['Special thanks', 'You, for playing to the very bottom'],
  ];
}

function rollOf(entry) {
  const roll = el('div', 'credits-roll');
  roll.append(el('h2', 'credits-logo', 'PokéDB'), el('p', 'credits-version', 'v1.0'));
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

/** Roll the credits over `scene`; resolves once THE END is tapped away. */
export async function rollCredits(scene, entry) {
  const layer = el('div', 'hof-credits scene-keep');
  const roll = rollOf(entry);
  const end = el('div', 'credits-end');
  end.append(el('h2', '', 'THE END'), el('p', '', 'Thanks for playing!'), el('p', 'credits-tap', '▼'));
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
  await new Promise(resolve => layer.addEventListener('click', (e) => { e.stopPropagation(); resolve(); }, { once: true }));
  layer.classList.add('out');
  await sleep(still() ? 0 : 500);
  layer.remove();
}
