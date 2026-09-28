/*
 * The Hall of Fame (Level 5 rewards, part 2), after Gold/Silver's: a won run on Trainer Level 5 is entered in the save
 * (`hallOfFame`, oldest first) and a scene plays before the result window: the screen flashes white and turns to a
 * starry night, your Pokémon slides in onto a pedestal under a spotlight and cries, its plate (entry number, name, type,
 * date) pops up, the text box welcomes it, and its final deck rises along the bottom. The Collection's Hall of Fame
 * card lists every entry; tapping one shows its deck. Under reduced motion nothing slides or flashes; the cry and
 * music stay.
 */
import { $, el, sleep, openDialog, makeCard, groupDeck } from './ui.js';
import { playMusic, playCry, preloadMusic, preloadCries } from './audio.js';
import { sceneSay } from './evolution.js';
import { fillDeck } from './deckpreview.js';
import { getSave, updateSave } from './storage.js';
import { STARTERS_BY_ID, spriteUrl, stageName } from './data/starters.js';
import { spriteFit } from './data/sprite-fit.js';
import { CARDS_BY_ID, TYPES } from './data/cards.js';

const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const CRY_WAIT_MAX = 1500;

/** Start downloading the song and the cry before the final boss, so the scene doesn't wait on them. */
export function preloadHallOfFame(starter) {
  preloadMusic('hall-of-fame');
  preloadCries(starter.line.at(-1).id);
}

/** Enter a won Level 5 run in the save and return its entry. */
export function enterHallOfFame(run, shiny) {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const entry = {
    no: getSave().hallOfFame.length + 1,
    starter: run.starter.id,
    stage: run.stage,
    shiny,
    type: run.starter.type,
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    level: run.level,
    deck: [...run.deck],
    relics: [...run.relics],
    fights: run.fights,
  };
  updateSave(d => { d.hallOfFame.push(entry); });
  return entry;
}

const starterOf = (entry) => STARTERS_BY_ID[entry.starter];
const nameOf = (entry) => stageName(starterOf(entry), entry.stage);
const imgOf = (entry) => spriteUrl(starterOf(entry), 'front', entry.stage, entry.shiny);
const typeOf = (entry) => TYPES[entry.type] ?? { label: entry.type, icon: '' };
const numberOf = (entry) => `No.${String(entry.no).padStart(3, '0')}`;
/** "28 Sep 2026", read as a local date (a bare "2026-09-28" would parse as UTC midnight and show the day before in the Americas). */
function dateOf(entry) {
  const [y, m, d] = entry.date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
const chip = (entry) => el('span', `index-only type-${entry.type}`, `${typeOf(entry).icon} ${typeOf(entry).label}`);

/** The plate under the pedestal (and atop an entry in the Collection window): number, name, type, date. */
function plate(entry) {
  const box = el('div', 'hof-plate');
  const head = el('div', 'hof-plate-head');
  head.append(el('span', 'hof-no', numberOf(entry)), el('strong', 'hof-name', `${nameOf(entry)}${entry.shiny ? ' ✨' : ''}`));
  const foot = el('div', 'hof-plate-foot');
  foot.append(chip(entry), el('span', 'hof-date', dateOf(entry)), el('span', 'hof-level', `Lv.${entry.level}`));
  box.append(head, foot);
  return box;
}

/** A strip of small cards, copies stacked (×N). */
function deckStrip(entry) {
  const strip = el('div', 'hof-deck scene-keep');
  strip.append(...groupDeck(entry.deck, CARDS_BY_ID).filter(g => g.card)
    .map(({ card, count }) => {
      const node = makeCard(card, { stage: entry.stage, count });
      node.classList.add('small');
      return node;
    }));
  return strip;
}

/**
 * Size the sprite so its resting pose (SPRITE_FIT) is about a third of the stage's height or half its width, in half
 * steps so the pixels stay even, standing its feet on the pedestal's top.
 */
function fit(img, box) {
  const [top, bottom, left, right] = spriteFit(img.src);
  const pose = Math.max(img.naturalWidth - left - right, img.naturalHeight - top - bottom) || 64;
  const room = Math.min(box.clientWidth * 0.55, box.clientHeight * 0.62);
  const s = Math.max(1, Math.min(4, Math.floor((room / pose) * 2) / 2));
  img.style.width = `${img.naturalWidth * s}px`;
  img.style.height = `${img.naturalHeight * s}px`;
  img.style.translate = `calc(-50% + ${((right - left) / 2) * s}px) ${bottom * s}px`;
}

const loaded = (img) => img.complete && img.naturalWidth ? null
  : new Promise(resolve => { img.onload = img.onerror = resolve; });

/** Play the scene for a new entry. Resolves once the last line is tapped away and the scene has faded out. */
export async function hallOfFameScene(entry) {
  const scene = $('hof-scene');
  const img = $('hof-mon');
  const stage = $('hof-stage');
  const name = nameOf(entry);
  img.src = imgOf(entry);
  img.alt = name;
  $('hof-plate-slot').replaceChildren(plate(entry));
  $('hof-deck-slot').replaceChildren(deckStrip(entry));
  $('hof-log').hidden = true;
  scene.className = `hof-scene${still() ? ' still' : ''}`;
  scene.hidden = false;
  playMusic('hall-of-fame', { restart: true });

  await Promise.all([loaded(img), sleep(still() ? 300 : 900)]);
  const refit = () => fit(img, stage);
  refit();
  addEventListener('resize', refit);

  scene.classList.add('mon-in');
  await sleep(still() ? 200 : 900);
  await Promise.race([playCry(starterOf(entry).line[entry.stage].id), sleep(CRY_WAIT_MAX)]);
  scene.classList.add('plate-in');
  await sceneSay('hof-scene', 'hof-log', ['Welcome to the HALL OF FAME!',
    `${name} became a champion on Trainer Level ${entry.level}!`]);

  scene.classList.add('deck-in');
  await sleep(still() ? 0 : 500);
  await sceneSay('hof-scene', 'hof-log', [`${name}'s final deck: ${entry.deck.length} cards.`,
    `It is entered in the Hall of Fame as ${numberOf(entry)}. Congratulations!`]);

  scene.classList.add('out');
  await sleep(still() ? 0 : 600);
  removeEventListener('resize', refit);
  scene.hidden = true;
  scene.className = 'hof-scene';
}

/* ---------- the Collection's window ---------- */

/** The Hall of Fame window: every entry, newest first; tapping one shows its deck. */
export function openHallOfFame() {
  showList();
  openDialog('hof-dialog');
}

function showList() {
  const entries = getSave().hallOfFame;
  $('hof-dialog-sub').textContent = entries.length
    ? `${entries.length} ${entries.length === 1 ? 'champion' : 'champions'}. Tap one to see its deck.`
    : 'No champions yet. Win a run on Trainer Level 5 to enter the Hall of Fame.';
  $('hof-body').replaceChildren(...[...entries].reverse().map(entry => {
    const row = el('button', `hof-row type-${entry.type}`);
    row.type = 'button';
    const pic = el('span', 'hof-row-pic');
    const img = el('img', 'pixel');
    img.src = imgOf(entry);
    img.alt = '';
    pic.append(img);
    const text = el('span', 'hof-row-text');
    const line = el('span', 'hof-row-line');
    line.append(chip(entry), el('span', '', dateOf(entry)));
    text.append(el('strong', '', `${numberOf(entry)} ${nameOf(entry)}${entry.shiny ? ' ✨' : ''}`), line,
      el('small', '', `${entry.deck.length} cards · ${entry.relics.length} relics · ${entry.fights} fights won`));
    row.append(pic, text, el('span', 'hof-row-go', '▶'));
    row.addEventListener('click', () => showEntry(entry));
    return row;
  }));
  $('hof-body').scrollTop = 0;
}

function showEntry(entry) {
  const back = el('button', 'btn secondary hof-back', '◀ All entries');
  back.type = 'button';
  back.addEventListener('click', showList);
  const top = el('div', `hof-entry type-${entry.type}`);
  const pic = el('span', 'hof-entry-pic');
  const img = el('img', 'pixel');
  img.src = imgOf(entry);
  img.alt = nameOf(entry);
  pic.append(img);
  top.append(pic, plate(entry));
  const cards = el('div', 'card-pool hof-cards');
  fillDeck(cards, entry.deck.filter(id => CARDS_BY_ID[id]), entry.stage);
  $('hof-dialog-sub').textContent = `Final deck: ${entry.deck.length} cards. Tap a card to read it.`;
  $('hof-body').replaceChildren(back, top, cards);
  $('hof-body').scrollTop = 0;
}
